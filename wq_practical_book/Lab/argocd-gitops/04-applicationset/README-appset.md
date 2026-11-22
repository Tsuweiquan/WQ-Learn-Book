# Setup of Application Set

Define Folder Hierarchy first
```text
wq_practical_book/argocd/
  root.yaml                      # the only file you apply by hand: an Application
                                 # whose source is this repo, path argocd/apps
  apps/
    notification-service.yaml    # the ApplicationSet: dev 1.*, prod pinned
  infrastructure/                # later, one Application per component
    zot.yaml
    prometheus.yaml
    grafana.yaml
```

## Bootstrap: apply root.yaml once

`root.yaml` is an "app of apps": an Application whose source is this repo on `main`, path `wq_practical_book/argocd/apps`. Argo CD applies whatever is in that folder, so the ApplicationSet itself is managed from Git.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Tsuweiquan/WQ-Learn-Book.git
    targetRevision: main
    path: wq_practical_book/argocd/apps
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```bash
kubectl apply -f argocd/root.yaml
```
- This is the only `kubectl apply` in the flow. Every change after this is a Git push.
- `targetRevision: main`: changes on a branch do nothing until they are merged.
- `prune: true`: removing a file from `argocd/apps` removes what it created from the cluster.

## Creating the applicationSet
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: notification-service
  namespace: argocd
spec:
  goTemplate: true
  goTemplateOptions: ["missingkey=error"]
  generators:
  - list:
      elements:
      - env: dev
        chartVersion: "1.*"       # follow every 1.x release
        helmValues:
          httpRoute:
            hostnames:
              - "notification-service-dev.internal.kind.test"
          resources:
            limits:
              memory: 0.5Gi
          replicaCount: 2         # the chart's key, not "replicas" (see the gotcha below)
      - env: qa
        chartVersion: "1.0.3"     # pinned; promote by editing this
        helmValues:
          httpRoute:
            hostnames:
              - "notification-service-qa.internal.kind.test"
          resources:
            limits:
              memory: 0.5Gi
      - env: prod
        chartVersion: "1.0.3"     # pinned; promote by editing this
        helmValues:
          httpRoute:
            hostnames:
              - "notification-service-prod.internal.kind.test"
          resources:
            limits:
              memory: 1Gi
  template:
    metadata:
      name: 'notification-service-{{ .env }}'
    spec:
      project: default
      source:
        repoURL: oci://zot.registry.svc.cluster.local:5000/charts/notification-service
        path: .
        targetRevision: '{{ .chartVersion }}'
        helm:
          releaseName: notification-service
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{ .env }}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
        - CreateNamespace=true
  templatePatch: |
    spec:
      source:
        helm:
          valuesObject:
            {{- toYaml .helmValues | nindent 8 }}
```
Things to take note!
1. Any helm override can be done in the list generators
2. Typos are ignored without warning, so must test them! (It happened: see the gotcha below.)
3. Argo CD's Helm docs give the order as parameters > valuesObject > values > valueFiles > the chart's values.yaml
4. Values that should be the same in every environment are best left as the chart's defaults in values.yaml, which you'd change with a chart release.
5. With `root.yaml` applied, there are two triggers: a new chart version in Zot (dev follows `chartVersion: "1.*"`) and a Git commit to `argocd/apps/` (the root app). See below.
6. `goTemplateOptions: ["missingkey=error"]` only catches a key missing from a generator element, such as `{{ .chartVersion }}`. It does not check the Helm values inside `helmValues`.

# Two ways a change reaches the cluster

| Trigger | Who notices | Example |
| --- | --- | --- |
| Git commit to `argocd/apps/` on `main` | the `root` app, on its next Git check | prod's `chartVersion`, a `helmValues` override |
| New chart version in Zot | `notification-service-dev`, which re-resolves `1.*` on its next refresh | CI pushes `1.0.4` |

## Making a Git commit cause a sync

1. You commit a change to the ApplicationSet, for example prod's chartVersion: "1.0.4", and push to main.
2. Argo CD notices the new commit on its next Git check, within about 3 minutes.
3. Argo CD applies the updated ApplicationSet, and the ApplicationSet updates the prod Application.
4. Prod syncs to 1.0.4.

## A new release reaching dev (no Git change to argocd/)

1. Bump the version in `apps/notification-service/pom.xml` (`1.0.3-SNAPSHOT` → `1.0.4-SNAPSHOT`) and merge to `main`.
2. `notification-service.yml` builds the app and pushes image `zot.internal.kind.test/notification-service:1.0.4`. It then packages the chart with `--version 1.0.4 --app-version 1.0.4` and pushes `charts/notification-service:1.0.4` (see [03-oci](../03-oci/README-oci.md)).
3. Dev's `targetRevision: "1.*"` resolves to `1.0.4` on its next refresh, and auto-sync rolls it out. qa and prod stay on `1.0.3` until their pin is changed in Git.

Check which version each env is on:
```bash
kubectl -n argocd get applications \
  -o custom-columns=NAME:.metadata.name,REVISION:.status.sync.revision,SYNC:.status.sync.status,HEALTH:.status.health.status
```

# Gotcha: `replicas` vs `replicaCount`

What happened
- Set `replicas: 2` in dev's `helmValues`, then `replicas: 3`. Dev stayed at 1 pod, and Argo CD still showed Synced / Healthy.

Why
- The chart's Deployment reads `.Values.replicaCount` (`helm/notification-service/templates/deployment.yaml`, the `helm create` default).
- Helm ignores keys a chart doesn't use. `replicas` reached Helm and was dropped without an error.
- The rendered Deployment still said `replicas: 1`, which matched the cluster, so Argo CD had nothing to sync.

How to find it: follow the hops

Git (`main`) → `root` → ApplicationSet → Application `notification-service-dev` → Helm render → Deployment

1. Did the value reach the Application?
   ```bash
   kubectl -n argocd get application notification-service-dev \
     -o jsonpath='{.status.sync.revision}{"\n"}{.spec.source.helm.valuesObject}{"\n"}'
   ```
   If the key is in the second line, Git → root → ApplicationSet → Application all work, so the problem is in the chart.
2. Which keys does the chart actually take?
   ```bash
   helm show values oci://zot.internal.kind.test/charts/notification-service --version 1.0.4 | grep -i replica
   ```

Fix
- `replicaCount: 2` (commit ea504bb).

Prevent it next time (not done yet)
- Add `helm/notification-service/values.schema.json` with `"additionalProperties": false`, which means listing every top-level key the chart takes.
- Helm validates values against the schema on `helm template`, `lint`, `install` and `upgrade`. A key like `replicas` then fails the render, and the Application shows an error instead of a silent no-op.
