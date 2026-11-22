# Install Zot

Docs: https://zotregistry.dev/v2.1.0/install-guides/install-guide-k8s/
Lab page: [Argo CD GitOps from OCI, 3.2 Install zot](https://tsuweiquan.github.io/WQ-Learn-Book/ci-cd/argocd-gitops#im-zot)

**Status (2026-11-22):** zot runs in the `registry` namespace with a PVC. The UI and the registry API are reachable over HTTPS through the Gateway. CI pushes `notification-service` to it, and the kind nodes pull from it. Next: Argo CD (`02-argocd`).

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
| `service.type` | `LoadBalancer` (was `NodePort`) | The page's way for containerd on the kind node: pull from a plain `http://<IP>:5000` via `hosts.toml`. Through the Gateway, the `Host` header wouldn't match the HTTPRoute hostname. I ended up pulling through the Gateway over HTTPS instead (section 7). |
| `httproute.enabled` | `true` | Reach the UI from the browser at `https://zot.internal.kind.test` |
| `httproute.parentRefs` | `gateway` / `gateway-infra` / `https` | Must match my Gateway in `kind/gateway.yaml`: its name, namespace and listener name. It was `default` (plain HTTP) until the `https` listener existed (section 5). |
| `httproute.hostnames` | `zot.internal.kind.test` | Matches the Gateway listener's `*.internal.kind.test` |
| `mountConfig` | `true` | Without it the chart ignores `configFiles` and zot runs on the image's built-in config |
| `configFiles.config.json` | the page's config | `compat: ["docker2s2"]` so `docker push` works, `search` + `ui` extensions for the web UI |
| `persistence`, `pvc.storage` | `true`, `5Gi` | Images survive pod restarts. With persistence the chart runs a StatefulSet (`zot-0`). |

## 2. Access through the Gateway API

At first the Gateway's only listener was `default`: plain HTTP, port 80, `*.internal.kind.test`. Once the HTTPRoute was accepted, the UI loaded at http://zot.internal.kind.test/home. Since section 5 the route is on the `https` listener, at https://zot.internal.kind.test/home.

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

## 4. Test push through a port-forward

Docker uses plain HTTP only for `localhost`, so before HTTPS I pushed through a port-forward, not the Gateway hostname. No `docker login` is needed because the config has no auth.

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

## 5. HTTPS through the Gateway

I installed cert-manager and gave the Gateway's new `https` listener a wildcard certificate signed by my own root CA (`WQ Lab CA`). My PC trusts that root, so Docker now pushes to zot by name, with no port-forward.

How the CA and the certificate were made: [my cert-manager notes](../../cert-manager/README-cert-manager.md) and the [Private CA for HTTPS](https://tsuweiquan.github.io/WQ-Learn-Book/security/private-ca-https) page.

```bash
docker tag alpine:3.20 zot.internal.kind.test/test/alpine:3.20
docker push zot.internal.kind.test/test/alpine:3.20
```

```text
The push refers to repository [zot.internal.kind.test/test/alpine]
08bc4e534116: Layer already exists
3.20: digest: sha256:2946df84c6516b588d1a5c256d6b319232a5f4af6134b8044a33f1c77ea20a06 size: 527
```

## 6. CI pushes notification-service to zot

`.github/workflows/notification-service.yml` sets `REGISTRY: zot.internal.kind.test` and has a new last step. It runs on the self-hosted runner after the image is built and loaded into kind:

```yaml
      - name: Push the image into the internal registry
        run: |
          docker tag "${IMAGE}:${VERSION}" "${REGISTRY}/${IMAGE}:${VERSION}"
          docker push "${REGISTRY}/${IMAGE}:${VERSION}"
```

Bumping the app to `1.0.3-SNAPSHOT` tested it. CI strips `-SNAPSHOT`, so zot has `notification-service:1.0.3`, and `helm/notification-service/values.yaml` now pulls `zot.internal.kind.test/notification-service:1.0.3`.

## 7. The kind nodes couldn't pull from zot

The push comes from my PC, but the pull is done by containerd inside the `kind-control-plane` container. That's a different client with its own network and its own trust store (page section [2.6 "One registry, three network views"](https://tsuweiquan.github.io/WQ-Learn-Book/ci-cd/argocd-gitops#th-network)).

Test from the node, the same pull the kubelet asks for:

```bash
docker exec kind-control-plane crictl pull zot.internal.kind.test/notification-service:1.0.3
```

Two problems, one after the other:

| # | Problem | Error | Fix |
| --- | --- | --- | --- |
| 1 | DNS: the node can't find the name. Its lookups go to Docker's DNS (`172.18.0.1`), which doesn't read my PC's `/etc/hosts`. | `lookup zot.internal.kind.test on 172.18.0.1:53: no such host` | Add `<Gateway IP> zot.internal.kind.test` to the node's `/etc/hosts` |
| 2 | Trust: the node doesn't trust `WQ Lab CA` | `tls: failed to verify certificate` | Copy `wq-lab-ca.crt` into `/etc/containerd/certs.d/zot.internal.kind.test/`, with a `hosts.toml` whose `ca` points at it. That trusts the root for this registry only, and containerd needs no restart. |

After both fixes: `Image is up to date`.

[`kind/zot-node-setup.sh`](../../../kind/zot-node-setup.sh) does both on every node, and only adds what's missing, so it's safe to re-run.

- The `certs.d` files survive a node restart.
- The `/etc/hosts` line doesn't: Docker rewrites the file when `kind-control-plane` starts. Tested: after a restart the pull failed again, and worked once cron had re-run the script.

So cron runs it every 5 minutes (`crontab -e`):

```text
*/5 * * * * /home/weiquan/wq_learn_book/wq_practical_book/kind/zot-node-setup.sh >> $HOME/.cache/zot-node-setup.log 2>&1
```

## 8. Notes for Argo CD

The chart is pulled by `argocd-repo-server`, a pod, not by containerd. A pod can't see the node's `/etc/hosts` or `certs.d`, so section 7 doesn't help it:

- **DNS:** CoreDNS only knows cluster names like `*.svc.cluster.local`. It passes other names on to the same Docker DNS (`172.18.0.1`) that failed for containerd, so `zot.internal.kind.test` would give `no such host` again.
    - zot runs in the same cluster, so use the in-cluster URL: `oci://zot.registry.svc.cluster.local:5000`.
- **Trust:** the repo-server doesn't trust `WQ Lab CA` unless it's given the certificate.
    - The in-cluster URL is plain HTTP, so set `insecureOCIForceHttp: "true"` in the repo-creds Secret, and no CA is needed. That's the page's way.
    - The other option is giving the repo-server the CA, for example through `argocd-tls-certs-cm`. The Argo CD docs only describe that ConfigMap for Git repos over HTTPS, so it's untested for OCI.
