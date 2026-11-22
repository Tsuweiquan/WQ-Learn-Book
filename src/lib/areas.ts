/**
 * The areas of the Learn Book, in display order. Each one is a folder in content/ and the
 * first segment of its pages' URLs (/observability/otel-java-kind). A new folder needs an
 * entry here; until it has one, it shows last, with its folder name as the title.
 */
export interface Area {
  slug: string;
  title: string;
  /** One line under the area's heading in the topic index. */
  blurb: string;
}

export const AREAS: Area[] = [
  { slug: "ci-cd", title: "CI/CD", blurb: "Pipelines that build, test and deploy." },
  {
    slug: "release-strategies",
    title: "Release strategies",
    blurb: "Shipping a new version without downtime: blue-green, canary, rollback.",
  },
  { slug: "containers", title: "Containers", blurb: "Images, registries and the standards under them." },
  { slug: "messaging", title: "Messaging", blurb: "Event streaming and queues that don't lose data." },
  {
    slug: "observability",
    title: "Observability",
    blurb: "Metrics, logs and traces: collecting, shipping, storing and querying them.",
  },
  { slug: "security", title: "Security", blurb: "Certificates, trust and keeping traffic encrypted." },
  { slug: "ai", title: "AI", blurb: "Using LLMs and retrieval in day-to-day engineering." },
];

/** First URL segments that are routes of their own, so no area folder may use them. */
export const RESERVED_SLUGS = new Set(["topics", "practical", "tags"]);

export function findArea(slug: string): Area {
  return (
    AREAS.find((a) => a.slug === slug) ?? {
      slug,
      title: slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
      blurb: "",
    }
  );
}

export function areaOrder(slug: string): number {
  const i = AREAS.findIndex((a) => a.slug === slug);
  return i === -1 ? AREAS.length : i;
}
