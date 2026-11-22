# Create OCI and push

```bash
helm package helm/notification-service --version 1.0.3 --app-version 1.0.3 -d /tmp/charts
helm push /tmp/charts/notification-service-1.0.3.tgz oci://zot.internal.kind.test/charts
curl -s https://zot.internal.kind.test/v2/charts/notification-service/tags/list; echo
curl -s https://zot.internal.kind.test/v2/notification-service/tags/list; echo
```

When ran `helm package helm/notification-service --version 1.0.3 --app-version 1.0.3 -d /tmp/charts`
- it only patches the Chart.yml.

So we should set the `image.tag` to `""` empty.

It is common and better to set the Chart version and App version to the same.
Why?
- The chart carries the image tag, through appVersion once tag is empty. A new image therefore needs a chart with a new appVersion, and that means a new package. A package needs a new chart version, because re-pushing 1.0.3 with different content overwrites the tag in Zot. Argo CD's 1.* would then not see a new version, and prod's pin would stop meaning "the same thing every time" (1.4: tags must not be overwritten).

So even with no template changes, every app release produces a chart release.


## Patch CI tool to also package and upload into ZOT
```yaml
    - name: Package into OCI and push to the internal registry
        working-directory: wq_practical_book
        run: |
          helm package helm/notification-service \
            --version "$VERSION" \
            --app-version "$VERSION" \
            --destination "$RUNNER_TEMP/charts"
          helm push "$RUNNER_TEMP/charts/notification-service-$VERSION.tgz" oci://"${REGISTRY}"/charts
```


# Register ZOT into ArgoCD
Any Application whose repoURL starts with oci://zot.registry.svc.cluster.local:5000 gets the template's settings, whichever chart or path it names. 
```yaml
configs:
  params:
    create: true
    server.insecure: true
  credentialTemplates:
    # Register the registry into argo
    # with this argo can access all the oci artifacts
    zot:
      url: "oci://zot.registry.svc.cluster.local:5000"
      type: "oci"
      insecureOCIForceHttp: "true"

```
Update ArgoCD
```bash
helm upgrade --install argocd argo/argo-cd --version 10.18.2 -f Lab/argocd-gitops/02-argocd/argocd-values.yaml -n argocd
```

