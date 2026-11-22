# Install Zot

Docs: https://zotregistry.dev/v2.1.0/install-guides/install-guide-k8s/
Lab page: [Argo CD GitOps from OCI, 3.2 Install zot](https://tsuweiquan.github.io/WQ-Learn-Book/ci-cd/argocd-gitops#im-zot)

Status: zot runs in the `registry` namespace with a PVC, the UI is reachable through the Gateway, and a test image push worked. Next: containerd `hosts.toml` (page section 3.3).

## 1. Install

```bash
helm repo add project-zot http://zotregistry.dev/helm-charts
helm search repo zot
helm pull project-zot/zot --version 0.1.135   # to read the chart (unpacked in helm/zot/)
tar -zxvf zot-0.1.135.tgz

kubectl create ns registry
helm upgrade --install zot project-zot/zot --version 0.1.135 -f Lab/argocd-gitops/01-zot/zot-values.yaml -n registry --wait
kubectl get pods,svc,pvc -n registry
```

`zot-values.yaml` is the chart's full default `values.yaml`, edited. What I changed:

| Value | Set to | Why |
| --- | --- | --- |
| `service.type` | `LoadBalancer` (was `NodePort`) | containerd on the kind node pulls from a plain `http://<IP>:5000` via `hosts.toml`. Through the Gateway, the `Host` header wouldn't match the HTTPRoute hostname. |
| `httproute.enabled` | `true` | Reach the UI from the browser at `http://zot.internal.kind.test` |
| `httproute.parentRefs` | `gateway` / `gateway-infra` / `default` | Must match my Gateway in `kind/gateway.yaml`: its name, namespace and listener name |
| `httproute.hostnames` | `zot.internal.kind.test` | Matches the Gateway listener's `*.internal.kind.test` |
| `mountConfig` | `true` | Without it the chart ignores `configFiles` and zot runs on the image's built-in config |
| `configFiles.config.json` | the page's config | `compat: ["docker2s2"]` so `docker push` works, `search` + `ui` extensions for the web UI |
| `persistence`, `pvc.storage` | `true`, `5Gi` | Images survive pod restarts. With persistence the chart runs a StatefulSet (`zot-0`). |

## 2. Access through the Gateway API

The Gateway's only listener is `default`: plain HTTP, port 80, `*.internal.kind.test`. Once the HTTPRoute was accepted, the UI loaded at http://zot.internal.kind.test/home.

Check that the route is attached:

```bash
kubectl get httproute -n registry
kubectl describe httproute -n registry zot | sed -n '/Status:/,$p'   # Parents → Accepted: True
```

## 3. Storage: where the PV lives

kind's `standard` StorageClass is Rancher's local-path-provisioner, so the PV is a plain directory on the node, which is the `kind-control-plane` container, under `/var/local-path-provisioner/`. The data survives pod restarts and `helm upgrade`, but not `kind delete cluster`. Keeping it on my PC's own filesystem would need `extraMounts` in the kind config and a cluster rebuild. Not worth it for a lab.

```bash
kubectl get storageclass standard -o jsonpath='{.provisioner}{"\n"}'
docker exec kind-control-plane ls /var/local-path-provisioner/
```

## 4. Test push

Docker uses plain HTTP only for `localhost`, so I push through a port-forward, not the Gateway hostname. No `docker login` is needed because the config has no auth.

```bash
# terminal 1
kubectl port-forward -n registry svc/zot 5001:5000

# terminal 2
docker pull alpine:3.20
docker tag alpine:3.20 localhost:5001/test/alpine:3.20
docker push localhost:5001/test/alpine:3.20
curl -i http://localhost:5001/v2/
curl -i http://localhost:5001/v2/_catalog
curl -i http://localhost:5001/v2/test/alpine/tags/list
```

Result: all three `200`. `Docker-Distribution-Api-Version: registry/2.0` on `/v2/`, `{"repositories":["test/alpine"]}`, `{"name":"test/alpine","tags":["3.20"]}`. The image also shows in the UI. The repository path (`test/alpine`) is what's stored; the host part (`localhost:5001`, `zot.internal.kind.test`) is only how each client reaches zot.

## Install cert-manager to get https available

Once install cert-manager and attached a self signed certificate into the envoy gateway api, HTTPS with TLS connectivity is available.

```bash
docker tag alpine:3.20 zot.internal.kind.test/test/alpine:3.20
docker push zot.internal.kind.test/test/alpine:3.20
# This should work now!
The push refers to repository [zot.internal.kind.test/test/alpine]
08bc4e534116: Layer already exists 
3.20: digest: sha256:2946df84c6516b588d1a5c256d6b319232a5f4af6134b8044a33f1c77ea20a06 size: 527
```

## Patch the CI to push notification-service into Zot