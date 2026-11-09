# Install Gateway API on KinD

[cloud-provider-kind](https://github.com/kubernetes-sigs/cloud-provider-kind) gives a KinD cluster a LoadBalancer controller and a Gateway API controller. It also installs the Gateway API CRDs for you, so there's no separate CRD step. It's for learning only, not production.

Source: [Experimenting with Gateway API using kind](https://kubernetes.io/blog/2026/01/28/experimenting-gateway-api-with-kind/) (Kubernetes blog, 2026-01-28).

You need Docker, kubectl, kind and curl.

## 1. Cluster

Skip this if you already have one. `kind get clusters` lists them.

```bash
kind create cluster
```

## 2. Run cloud-provider-kind

It runs as a container on the host, next to the cluster. `latest` was `v0.12.0` on 2026-11-09.

```bash
VERSION="$(basename $(curl -s -L -o /dev/null -w '%{url_effective}' https://github.com/kubernetes-sigs/cloud-provider-kind/releases/latest))"
docker run -d --name cloud-provider-kind --rm --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  registry.k8s.io/cloud-provider-kind/cloud-controller-manager:${VERSION}

docker ps --filter name=cloud-provider-kind
kubectl get gatewayclass   # expect: cloud-provider-kind
```

## 3. Gateway

```bash
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: gateway-infra
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: gateway
  namespace: gateway-infra
spec:
  gatewayClassName: cloud-provider-kind
  listeners:
  - name: default
    hostname: "*.exampledomain.example"
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: All   # in real clusters prefer Same or Selector
EOF

kubectl get gateway -n gateway-infra gateway
```

```text
NAME      CLASS                 ADDRESS      PROGRAMMED   AGE
gateway   cloud-provider-kind   172.18.0.3   True         5m6s
```

## 4. Demo app and HTTPRoute

```bash
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: demo
---
apiVersion: v1
kind: Service
metadata:
  name: echo
  namespace: demo
  labels: { app.kubernetes.io/name: echo }
spec:
  selector: { app.kubernetes.io/name: echo }
  ports:
  - name: http
    port: 3000
    targetPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: echo
  namespace: demo
  labels: { app.kubernetes.io/name: echo }
spec:
  selector:
    matchLabels: { app.kubernetes.io/name: echo }
  template:
    metadata:
      labels: { app.kubernetes.io/name: echo }
    spec:
      containers:
      - name: echo-basic
        image: registry.k8s.io/gateway-api/echo-basic:v20251204-v1.4.1
        env:
        - name: POD_NAME
          valueFrom: { fieldRef: { fieldPath: metadata.name } }
        - name: NAMESPACE
          valueFrom: { fieldRef: { fieldPath: metadata.namespace } }
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: echo
  namespace: demo
spec:
  parentRefs:
  - name: gateway
    namespace: gateway-infra
  hostnames: ["some.exampledomain.example"]
  rules:
  - matches:
    - path: { type: PathPrefix, value: / }
    backendRefs:
    - name: echo
      port: 3000
EOF
```

## 5. Test

```bash
GW_ADDR=$(kubectl get gateway -n gateway-infra gateway -o jsonpath='{.status.addresses[0].value}')
curl --resolve some.exampledomain.example:80:${GW_ADDR} http://some.exampledomain.example
```

```text
{
 "path": "/",
 "host": "some.exampledomain.example",
 "method": "GET",
 ...
 "namespace": "demo",
 "pod": "echo-dc48d7cf8-vs2df"
}
```

## If it doesn't work

- `kubectl get gateway -n gateway-infra gateway -o yaml`: you want `Accepted: True`, `Programmed: True` and an address under `.status.addresses`.
- `kubectl get httproute -n demo echo -o yaml`: under `status.parents`:
  - `ResolvedRefs: False` with `BackendNotFound` means the Service is missing or misnamed.
  - `Accepted: False` means the route didn't attach. Check `allowedRoutes` and the hostname.
- `docker logs -f cloud-provider-kind`

## Cleanup

```bash
kubectl delete namespace gateway-infra demo
docker stop cloud-provider-kind   # --rm removes the container
# kind delete cluster             # only if the cluster was just for this
```
