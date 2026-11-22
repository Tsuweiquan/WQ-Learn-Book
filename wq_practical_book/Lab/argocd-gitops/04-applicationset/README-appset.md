# Setup of Application Set

Define Folder Hierarchy first
```bash
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

Creating the applicationSet
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
2. Typos are ignored without warning, so must test them!
3. Argo CD's Helm docs give the order as parameters > valuesObject > values > valueFiles > the chart's values.yaml
4. Values that should be the same in every environment are best left as the chart's defaults in values.yaml, which you'd change with a chart release.
5. Current config only auto sync based on the OCI version since `chartVersion: "1.*`, does not autosynced on git changes yet.

# Making a Git commit cause a sync

1. You commit a change to the ApplicationSet, for example prod's chartVersion: "1.0.4", and push to main.
2. Argo CD notices the new commit on its next Git check, within about 3 minutes.
3. Argo CD applies the updated ApplicationSet, and the ApplicationSet updates the prod Application.
4. Prod syncs to 1.0.4.