import { PAGE_TYPE_LABEL, topics, type Topic } from "./topics";

interface Entry {
  topic: Topic;
  title: string;
  tags: string;
  rest: string;
}

const entries: Entry[] = topics.map((topic) => ({
  topic,
  title: `${topic.title} ${topic.shortTitle}`.toLowerCase(),
  tags: topic.tags.join(" ").toLowerCase(),
  rest: [topic.summary, topic.indexSummary, topic.area.title, PAGE_TYPE_LABEL[topic.type], topic.duration ?? ""]
    .join(" ")
    .toLowerCase(),
}));

/**
 * Pages whose title, tags, area, type or summaries contain every word of the query.
 * Title matches rank first, then tag matches. An empty query returns every page.
 */
export function searchTopics(query: string): Topic[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return topics;
  return entries
    .map((e) => {
      let score = 0;
      for (const term of terms) {
        if (e.title.includes(term)) score += 3;
        else if (e.tags.includes(term)) score += 2;
        else if (e.rest.includes(term)) score += 1;
        else return null;
      }
      return { topic: e.topic, score };
    })
    .filter((r) => r !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.topic);
}
