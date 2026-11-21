/**
 * URLs from before the area restructure (Nov 2026), so old links and bookmarks keep working.
 * Never remove an entry; when a page moves again, add its old path here.
 */

/** /topics/<old slug> → new page path. */
export const LEGACY_TOPICS: Record<string, string> = {
  "01-enterprise-cd-github": "/ci-cd/enterprise-cd-github",
  "02-blue-green-one-cluster": "/release-strategies/blue-green-one-cluster",
  "02a-blue-green-lab-ubuntu": "/release-strategies/blue-green-one-cluster/lab-ubuntu",
  "03-kafka-ha-durability": "/messaging/kafka-ha-durability",
  "04-otel-java-gcp": "/observability/otel-java-gcp",
  "05-otel-java-kind": "/observability/otel-java-kind",
  "05a-otel-traces-tempo": "/observability/otel-java-kind/traces-tempo",
  "06-oci-images-registries": "/containers/oci-images-registries",
  "07-vector-db-project-knowledge": "/ai/vector-db-project-knowledge",
  "08-vector-observability-pipeline": "/observability/vector-observability-pipeline",
};

/** Renamed folders and files in wq_practical_book/: old prefix → new prefix. The first match wins, so renamed files go before their folder. */
const LEGACY_PRACTICAL: [string, string][] = [
  ["Lab/otel-java-kind/02-logs/monolithic-values.yaml", "Lab/otel-java-kind/02-logs/loki-monolithic-values.yaml"],
  ["Lab/5.1.otel-logs/monolithic-values.yaml", "Lab/otel-java-kind/02-logs/loki-monolithic-values.yaml"],
  ["Lab/5.0.otel-metrics/", "Lab/otel-java-kind/01-metrics/"],
  ["Lab/5.1.otel-logs/", "Lab/otel-java-kind/02-logs/"],
  ["Lab/5.2.grafana/", "Lab/otel-java-kind/03-grafana/"],
];

export function legacyPracticalPath(path: string): string | undefined {
  const match = LEGACY_PRACTICAL.find(([from]) => path.startsWith(from));
  return match && match[1] + path.slice(match[0].length);
}
