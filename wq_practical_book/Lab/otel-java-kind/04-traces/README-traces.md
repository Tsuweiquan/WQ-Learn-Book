# Install with helm
```bash
cd wq_learn_book/wq_practical_book
helm upgrade --install tempo grafana-community/tempo --version 3.2.1 -n observability -f Lab/otel-java-kind/04-traces/tempo-values.yaml

```

## Why these values

[tempo-values.yaml](tempo-values.yaml) only holds the values that differ from the chart defaults. To see all defaults:

```bash
helm show values grafana-community/tempo --version 3.2.1
```

| Value | Set to | Why |
| --- | --- | --- |
| `tempo.streamOverHttpEnabled` | `true` | Lets Grafana's Tempo data source stream search results as they arrive. Tempo only allows streaming when this is on. |
| `tempo.reportingEnabled` | `false` | The chart default is `true`: Tempo sends an anonymous usage report to Grafana Labs. Not wanted for a lab. |
| `tempo.metricsGenerator.enabled` | `true` | Turns on the metrics-generator, which reads every span and builds Prometheus metrics from it. Without it, the whole `metrics_generator` block is left out of Tempo's config. |
| `tempo.metricsGenerator.remoteWriteUrl` | `http://prometheus-server.observability.svc.cluster.local:80/api/v1/write` | Where the generator pushes those metrics. Tempo isn't a metrics database, so it sends them to Prometheus with remote write. The default `prometheus.monitoring:9090` doesn't exist here. Found the Service with `kubectl -n observability get svc \| grep prometheus`. |
| `tempo.metricsGenerator.storage.path` | `/var/tempo/metrics` | The generator's own working folder (its WAL). Kept apart from the traces (`/var/tempo/traces`) and the trace WAL (`/var/tempo/wal`). |
| `tempo.overrides.defaults.metrics_generator.processors` | `service-graphs`, `span-metrics` | **Which** processors run. `enabled: true` alone makes no metrics. `defaults` applies to every tenant, and there is only one (multitenancy is off). |

### What the two processors produce

- **span-metrics:** RED metrics (rate, errors, duration) for each span name, such as `traces_spanmetrics_calls_total` and `traces_spanmetrics_latency_bucket`. You get them without writing metrics code in the app.
- **service-graphs:** `traces_service_graph_request_total` with `client` and `server` labels, meaning "who calls whom". Grafana draws the service map from it, for example `notification-service → postgres`.

## Things I learned from the values file

- **`processor` vs `processors`.** `tempo.metricsGenerator.processor` (underscores: `service_graphs`) only **tunes** a processor (`wait`, `max_items`). `tempo.overrides.defaults.metrics_generator.processors` (hyphens: `service-graphs`) decides **which** processors run. Setting only the first one does nothing.
- **Prometheus has to accept remote write.** It rejects pushes to `/api/v1/write` unless it runs with `--web.enable-remote-write-receiver`. Add `web.enable-remote-write-receiver` to `server.extraFlags` in the Prometheus values, or the service graph stays empty and Tempo's log shows remote-write errors.
- **Commenting out a key doesn't remove it.** Helm merges my file on top of the chart defaults, so a key I leave out keeps its default. Deleting a key needs `key: null`.
- **The Jaeger receivers stay on.** `tempo.receivers.jaeger: null` breaks the chart 3.2.1 render (`templates/_ports.tpl` reads `.jaeger.protocols` without a nil check). They only open extra ports. The app sends OTLP to the Collector, and the Collector sends OTLP to Tempo on 4318.
- **No persistence.** `persistence.enabled` is `false` by default. No volume is mounted at `/var/tempo`, so traces live in the container's filesystem and are gone when the pod restarts. That's fine for a lab, and it avoids a `Pending` PVC like the one Loki had.

## Check the rendered config before installing

```bash
helm template tempo grafana-community/tempo --version 3.2.1 -n observability \
  -f Lab/otel-java-kind/04-traces/tempo-values.yaml | grep -A6 'metrics_generator\|stream_over'
```

Expect `stream_over_http_enabled: true`, the `processors` list under `overrides`, and a `metrics_generator` block with `path: "/var/tempo/metrics"` and the `remote_write` URL.

## Ports on the `tempo` Service

| Port | Use |
| --- | --- |
| 4318 | OTLP/HTTP in. The Collector's `otlp_http/tempo` exporter sends here. |
| 4317 | OTLP/gRPC in. |
| 3200 | Query API. Grafana's Tempo data source and `curl /api/search` use it. |
| 14250, 6831, 6832, 14268 | Jaeger receivers (chart default, not used). |

```
Java agent ──OTLP──▶ gateway Collector (opentelemetry-collector, :4318)
                        │
                        ├─ metrics pipeline ─▶ otlp_http/prometheus ─▶ Prometheus  /api/v1/otlp
                        └─ traces pipeline  ─▶ otlp_http/tempo      ─▶ Tempo :4318 /v1/traces   (new)

Tempo metrics-generator ──remote write──▶ Prometheus /api/v1/write   (span metrics, service graph)

Logs: app stdout ─▶ otel-agent DaemonSet (file_log) ─▶ Loki   (your Lab 02 path; no gateway hop)

```