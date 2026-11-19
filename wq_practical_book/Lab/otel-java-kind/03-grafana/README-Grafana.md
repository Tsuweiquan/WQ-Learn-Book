# Setup Grafana!

This guide comes after README-Setup-Metrics.md (Prometheus) and README-Setup-Logs.md (Loki).

Grafana stores no data itself. It is a query and visualisation layer over **data sources**, here Prometheus (metrics) and Loki (logs), reached by the same in-cluster Service names the OTel Collector exports to.

```
                     ┌──────────────▶ Prometheus  (prometheus-server.observability:80)
browser ─▶ Gateway ─▶ Grafana
  grafana.internal.kind.test    └────▶ Loki        (loki.observability:3100)
```

## Install

```bash
helm search repo grafana
helm pull grafana-community/grafana
tar -zxvf grafana-14.4.1.tgz

# run from wq_practical_book/
helm upgrade --install grafana grafana-community/grafana --version 14.4.1 \
  -n observability -f Lab/otel-java-kind/03-grafana/grafana-values.yaml
kubectl -n observability rollout status deploy/grafana
```

> deployment "grafana" successfully rolled out

## Expose Grafana through the Gateway

The chart has a Gateway API `route` block, the same as the Prometheus chart. In `grafana-values.yaml`:

```yaml
route:
  main:
    enabled: true
    apiVersion: gateway.networking.k8s.io/v1
    kind: HTTPRoute
    hostnames:
      - grafana.internal.kind.test
    parentRefs:
      - name: gateway
        namespace: gateway-infra
        sectionName: default
    matches:
      - path:
          type: PathPrefix
          value: /
```

Add the hostname to `/etc/hosts`, pointing at the Gateway address:

```
172.18.128.0 grafana.internal.kind.test
```

Open http://grafana.internal.kind.test

## Log in

`adminPassword` is left commented out in the values, so the chart generates a random password and stores it in the `grafana` Secret. That keeps the password out of this (public) repo.

```bash
# user: admin
kubectl get secret --namespace observability grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

## Add the data sources

Connections → Data sources → Add data source:

| Data source | URL | Notes |
| --- | --- | --- |
| Prometheus | `http://prometheus-server.observability.svc.cluster.local` | Service port 80 |
| Loki | `http://loki.observability.svc.cluster.local:3100` | `auth_enabled: false` in Loki, so no `X-Scope-OrgID` header needed |

"Save & test" on each should report success.

Grafana runs inside the cluster, so it uses the in-cluster Service DNS names, not `prometheus.internal.kind.test` (that name only resolves on my laptop via `/etc/hosts`).

## Verify in Explore

- **Prometheus:** `notifications_sent_total`, or `rate(http_server_request_duration_seconds_count[5m])`
- **Loki:** `{service_name="notification-service"}`, or `{k8s_namespace_name="dev"}`

Both return data.

## Caveat: UI-added data sources are not persistent

`persistence.enabled: false`, so Grafana keeps its database (users, data sources, dashboards) in an emptyDir. If the pod restarts, the data sources added through the UI are gone.

The fix for a rebuildable lab is to **provision** them in `grafana-values.yaml` instead, so they come back on every install:

```yaml
datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
      - name: Prometheus
        uid: prometheus
        type: prometheus
        url: http://prometheus-server.observability.svc.cluster.local
        isDefault: true
      - name: Loki
        uid: loki
        type: loki
        url: http://loki.observability.svc.cluster.local:3100
```
