# Install Argocd

```bash
kubectl create namespace argocd
helm upgrade --install argocd argo/argo-cd --version 10.18.2 -f Lab/argocd-gitops/02-argocd/argocd-values.yaml -n argocd
```

- Remeber to update /etc/hosts to add in the `argocd.internal.kind.test` entry

Retrieve login password
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```
Reference to @argocd-values.yaml
- set the httproute url
- set insecure=true
    - we terminate on envoy gateway layer so we don't need to terminate tls on argocd.

