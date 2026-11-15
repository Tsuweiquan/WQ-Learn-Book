# Lab 5 · Set up OpenTelemetry metrics

## Prerequisites

The kind cluster is up, and notification-service is reachable through cloud-provider-kind:

```bash
$ curl http://notification-service.internal.kind.test/actuator/health
{"groups":["liveness","readiness"],"status":"UP"}
```

Create the namespace for the observability stack:

```bash
kubectl create ns observability
```

## 1. Two ways to expose OTel metrics from a Java app

| Way | How | What you gain |
| --- | --- | --- |
| **1. Java agent** (this lab) | The JVM loads `opentelemetry-javaagent.jar` on startup. Bake the jar into the image and configure it with env vars. | No code changes |
| **2. SDK in code** | Add `opentelemetry-api`, `opentelemetry-sdk` and `opentelemetry-exporter-otlp` to `pom.xml`. | Full control over what's recorded |

## 2. Patch the Dockerfile (Java agent)

```dockerfile
ARG OTEL_AGENT_VERSION=2.33.1
ADD --chmod=644 https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_AGENT_VERSION}/opentelemetry-javaagent.jar /app/opentelemetry-javaagent.jar
ENV JAVA_TOOL_OPTIONS="-javaagent:/app/opentelemetry-javaagent.jar"
ENV OTEL_SERVICE_NAME="notification-service"
```

Let CI build the image and load it into kind, then check that it's there:

```bash
$ docker exec -it kind-control-plane crictl images
docker.io/library/notification-service          1.0.1                                   fcf9a478391f4       279MB
```

## 3. Deploy the app

```bash
helm upgrade --install notification-service helm/notification-service \
  -f helm/notification-service/values.yaml -n dev
```

### Error: no OTel endpoint set

```text
[otel.javaagent 2026-11-15 11:10:16:531 +0000] [OkHttp http://localhost:4318/...] ERROR io.opentelemetry.exporter.otlp.internal.HttpExporter - Failed to export 2 spans. Th
java.net.ConnectException: Failed to connect to localhost/[0:0:0:0:0:0:0:1]:4318
    at okhttp3.internal.connection.ConnectPlan.connectSocket(ConnectPlan.kt:285)
    at okhttp3.internal.connection.ConnectPlan.connectTcp(ConnectPlan.kt:144)
    at okhttp3.internal.connection.FastFallbackExchangeFinder$launchTcpConnect$1.runOnce(FastFallbackExchangeFinder.kt:147)
    at okhttp3.internal.concurrent.TaskRunner$runnable$1.run(TaskRunner.kt:81)
    at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(Unknown Source)
    at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(Unknown Source)
    at java.base/java.lang.Thread.run(Unknown Source)
    Suppressed: java.net.ConnectException: Failed to connect to localhost/127.0.0.1:4318
        ... 7 more
    Caused by: java.net.ConnectException: Connection refused (connect failed)
        at java.base/sun.nio.ch.Net.pollConnect(Native Method)
        at java.base/sun.nio.ch.Net.pollConnectNow(Unknown Source)
        at java.base/sun.nio.ch.NioSocketImpl.timedFinishConnect(Unknown Source)
        at java.base/sun.nio.ch.NioSocketImpl.connect(Unknown Source)
        at java.base/java.net.SocksSocketImpl.connect(Unknown Source)
        at java.base/java.net.Socket.connect(Unknown Source)
        at okhttp3.internal.platform.Platform.connectSocket(Platform.kt:173)
        at okhttp3.internal.connection.ConnectPlan.connectSocket(ConnectPlan.kt:283)
        ... 6 more
```

### Resolution

With no endpoint set, the agent falls back to `localhost:4318`. Inside the pod nothing listens there. The fix is to set the agent's env vars, mainly the destination for the data:

| Variable | Purpose |
| --- | --- |
| `OTEL_SERVICE_NAME` | Service name. Already set in the image, so set it here only to override it. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Base URL of the OTel Collector |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf` (port 4318, the default) or `grpc` (port 4317) |
| `OTEL_TRACES_EXPORTER` | `none` to turn off traces |
| `OTEL_LOGS_EXPORTER` | `none` to turn off logs |

Set these in the Helm values file. The chart's Deployment template had no `env` block, so I patched it to accept one.

## 4. Install the OTel Collector

Source: https://opentelemetry.io/docs/platforms/kubernetes/helm/collector/#installing-the-chart

```bash
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm pull open-telemetry/opentelemetry-collector
tar -zxvf opentelemetry-collector-0.178.3.tgz
```

### Choosing `mode`

The chart requires `mode` to be set: `daemonset`, `deployment` or `statefulset`. Each maps to a pattern from the OpenTelemetry docs:

| Mode | Pattern | Use it when |
| --- | --- | --- |
| `deployment` | **Gateway**: a central pool behind one Service | Apps push OTLP to one address, and the Collector routes it to backends. **This lab.** |
| `daemonset` | **Agent**: one Collector per node | You need things only a node can see: tailing `/var/log/pods` (`filelog`), kubelet/node metrics (`kubeletstats`, `hostmetrics`), or keeping app → Collector traffic on the same node |
| `statefulset` | **Gateway with stable identity** | Sharded Prometheus scraping, or a persistent queue tied to one pod's volume |

`deployment` fits here because the app pushes OTLP to one Service DNS name and nothing needs node-level access. On a single-node kind cluster, a DaemonSet would also give you one pod, just with node-local plumbing you don't need.

Updated the values files in 
`wq_practical_book/Lab/5.otel-metrics/opentelemetry-collector-values.yaml`

To deploy the collector
```
helm upgrade --install opentelemetry-collector open-telemetry/opentelemetry-collector --version 0.178.3 -n observability -f opentelemetry-collector-values.yaml
```

After deploy back to setting the variables

| Variable | Purpose |
| --- | --- |
| `OTEL_SERVICE_NAME` | `notification-service` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://opentelemetry-collector.observability.svc.cluster.local:4318` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf` (port 4318, the default) or `grpc` (port 4317) |
| `OTEL_TRACES_EXPORTER` | `none` to turn off traces |
| `OTEL_LOGS_EXPORTER` | `none` to turn off logs |

### `http/protobuf` vs `grpc`

Both are OTLP with the same protobuf-encoded data. Only the transport underneath differs.

| | `http/protobuf` | `grpc` |
| --- | --- | --- |
| Transport | Plain HTTP `POST` (HTTP/1.1 or HTTP/2) | gRPC, always on HTTP/2 |
| Default port | 4318 | 4317 |
| Endpoint | One path per signal (`/v1/traces`, `/v1/metrics`, `/v1/logs`), appended to the base URL by the SDK | gRPC service methods: just `host:port`, no paths |
| Proxies, ingress, firewalls | Works through anything that handles HTTP | Needs HTTP/2 end to end, which some proxies and load balancers don't pass cleanly |
| Debugging | An HTTP request with a status code | Needs gRPC tooling (`grpcurl`) |
| Efficiency | Fine for most workloads | A bit more efficient: one long-lived connection multiplexes many requests |

- **Kubernetes gotcha with gRPC:** a ClusterIP Service balances per *connection*, not per request. Because gRPC holds one long-lived connection, each app pod sticks to one Collector replica. This only matters once you run more than one replica.
- **This lab uses `http/protobuf`.** It's the Java agent's default (since 2.0) and easier to debug. If you switch to `grpc`, change the port to 4317 too. A protocol/port mismatch just shows up as failed exports.
- **`http/json`** also exists: same paths, with a JSON body. It's handy for a hand-written `curl` test, but too large and slow for real traffic.


Once updated the env variables in the values.yaml for notification service, redeploy it.
`helm upgrade --install notification-service helm/notification-service -f helm/notification-service/values.yaml -n dev`
### Error: protocol and port don't match

```text
[otel.javaagent 2026-11-15 11:58:17:308 +0000] [OkHttp http://opentelemetry-collector.observability.svc.cluster.local:4317/...] ERROR io.opentelemetry.exporter.otlp.internal.HttpExporter - Failed to export 15 metrics. The request could not be executed.
java.net.SocketException: Connection reset
    at java.base/sun.nio.ch.NioSocketImpl.implRead(Unknown Source)
    ...
    at okhttp3.internal.http1.Http1ExchangeCodec.readResponseHeaders(Http1ExchangeCodec.kt:215)
    ...
[otel.javaagent 2026-11-15 11:58:17:309 +0000] [OkHttp http://opentelemetry-collector.observability.svc.cluster.local:4317/...] WARN io.opentelemetry.sdk.metrics.export.PeriodicMetricReader - Exporter failed
```

### Resolution

`HttpExporter` and `Http1ExchangeCodec` show the agent speaking plain HTTP/1.1 (`http/protobuf`), but `:4317` is the Collector's gRPC port. The gRPC server can't parse the request and resets the connection. The protocol and port must match:

```yaml
OTEL_EXPORTER_OTLP_ENDPOINT: http://opentelemetry-collector.observability.svc.cluster.local:4318
OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
```

Compare the two errors: `Connection refused` means nothing is listening at that address. `Connection reset` means something is listening but doesn't understand what was sent.
