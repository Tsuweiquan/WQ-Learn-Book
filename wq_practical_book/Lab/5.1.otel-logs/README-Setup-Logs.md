# Setup logging via otlp.

This guide should only be done after README-Setup-Metrics.md

## Install Loki

Guide/Documentation: https://grafana.com/docs/loki/latest/setup/install/helm/install-monolithic/

```
helm search repo grafana-community/loki

NAME                    CHART VERSION   APP VERSION     DESCRIPTION                                       
grafana-community/loki  21.2.3          3.7.10          Helm chart for Grafana Loki supporting monolith...

helm pull grafana-community/loki

tar -zxvf loki.tar.gz

```

Loki has 3 deployment modes.
Monolithic Mode - Ideal for getting started, testing, or smaller log volumes (typically under 20 GB to 100 GB per day).

Simple Scalable Mode - Designed for mid-sized environments handling up to roughly 1 TB of logs per day

Microservices (Distributed) Mode - Best for very large-scale, high-volume production environments processing over 1 TB of logs per day

so for this PoC we will go with Monolithic Mode
# Learnings

## Why `trace_id` is not a Loki label

Loki indexes **only labels**, never the log text. Each unique combination of label values is a **stream**, stored as its own compressed chunks. A query has two stages:

```text
{service_name="notification-service"}      ← 1. index lookup: which streams?  (fast, small index)
  | trace_id="4bf92f…"                     ← 2. scan those streams' lines     (structured metadata filter)
```

If `trace_id` were a label, every request would create a **new stream** with one or two lines in it:

- **The index explodes.** It grows with the number of requests, not the number of services.
- **Chunks become tiny.** Compression and storage efficiency fall apart. Loki is built for a few long streams.
- **Loki rejects writes.** Active streams per tenant are capped (`max_global_streams_per_user`), so a busy service hits the cap and Loki refuses its logs.

So per-request values (`trace_id`, `span_id`) go in **structured metadata**: stored per line and filterable, just not indexed. Labels are for low-cardinality "which source" values: service, namespace, environment. It's the same rule as Prometheus labels and Micrometer tags.

# Helm upgrade

```bash


helm upgrade --install loki grafana-community/loki --version 21.2.3 -f monolithic-values.yaml -n observability
```