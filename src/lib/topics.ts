import type { MDXProps } from "mdx/types";
import type { ComponentType } from "react";

import { areaOrder, findArea, RESERVED_SLUGS, type Area } from "./areas";

/**
 * - topic: a subject of its own, Parts 1–3 (and optionally 4).
 * - lab: a hands-on run of a parent topic: setup, what the tests prove, steps, checks, cleanup.
 * - deep-dive: one aspect of a parent topic in depth, full Parts 1–3, building on the parent.
 */
export type PageType = "topic" | "lab" | "deep-dive";

export const PAGE_TYPE_LABEL: Record<PageType, string> = {
  topic: "Topic",
  lab: "Lab",
  "deep-dive": "Deep dive",
};

export type TopicProgress = "partial" | "complete";

/** Frontmatter of a page in content/. Area and parent come from the file's path. */
export interface TopicFrontmatter {
  title: string;
  /** Used in breadcrumbs, the sidebar, the footer and the browser tab. */
  shortTitle: string;
  /** Lede under the page title. */
  summary: string;
  /** One line under the title in the topic index. */
  indexSummary: string;
  /** YYYY-MM-DD. Pages are ordered by it within an area. */
  added: string;
  tags: string[];
  /** Defaults to "topic". Pages in a topic's folder must be "lab" or "deep-dive". */
  type?: PageType;
  /** Labs: rough time to run it, e.g. "~45 min". */
  duration?: string;
  /** How far the user's own run of the lab got. Shown as a badge; omit if not started. */
  progress?: TopicProgress;
}

export interface Topic extends Omit<TopicFrontmatter, "type"> {
  type: PageType;
  area: Area;
  /** Path under content/ without the extension, e.g. "observability/otel-java-kind/traces-tempo". */
  id: string;
  /** The parent topic's id, for labs and deep dives. */
  parent?: string;
  /** Site path, e.g. "/observability/otel-java-kind/traces-tempo". */
  path: string;
  Content: ComponentType<MDXProps>;
}

const modules = import.meta.glob<{ default: ComponentType<MDXProps>; frontmatter: TopicFrontmatter }>(
  ["../../content/*/*.mdx", "../../content/*/*/*.mdx"],
  { eager: true },
);

const byDate = (a: Topic, b: Topic) => a.added.localeCompare(b.added) || a.title.localeCompare(b.title);

const all: Topic[] = Object.entries(modules).map(([file, mod]) => {
  const id = file.slice("../../content/".length, -".mdx".length);
  const [areaSlug = "", topicSlug, childSlug] = id.split("/");
  if (RESERVED_SLUGS.has(areaSlug)) console.error(`content/${areaSlug}/ clashes with the /${areaSlug} route`);
  return {
    ...mod.frontmatter,
    type: mod.frontmatter.type ?? (childSlug ? "deep-dive" : "topic"),
    area: findArea(areaSlug),
    id,
    parent: childSlug ? `${areaSlug}/${topicSlug}` : undefined,
    path: `/${id}`,
    Content: mod.default,
  };
});

/** Top-level topics, by area order, then date. */
const roots = all
  .filter((t) => !t.parent)
  .sort((a, b) => areaOrder(a.area.slug) - areaOrder(b.area.slug) || byDate(a, b));

export function childrenOf(id: string): Topic[] {
  return all.filter((t) => t.parent === id).sort(byDate);
}

/** Every page in reading order: each topic followed by its labs and deep dives. */
export const topics: Topic[] = roots.flatMap((t) => [t, ...childrenOf(t.id)]);

export interface AreaGroup {
  area: Area;
  topics: Topic[];
}

/** Areas that have pages, each with its top-level topics. */
export const areaGroups: AreaGroup[] = roots.reduce<AreaGroup[]>((groups, t) => {
  const last = groups.at(-1);
  if (last?.area.slug === t.area.slug) last.topics.push(t);
  else groups.push({ area: t.area, topics: [t] });
  return groups;
}, []);

export function findTopic(id: string | undefined): Topic | undefined {
  return all.find((t) => t.id === id);
}

/** Home page anchor for an area's section of the topic index. */
export function areaPath(area: Area): string {
  return `/#area-${area.slug}`;
}

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

export function tagPath(tag: string): string {
  return `/tags/${tagSlug(tag)}`;
}

export interface TagInfo {
  name: string;
  slug: string;
  topics: Topic[];
}

/** Every tag, most used first. Tags that differ only in case or punctuation are merged. */
export const tags: TagInfo[] = (() => {
  const bySlug = new Map<string, TagInfo>();
  for (const t of topics) {
    for (const name of t.tags) {
      const slug = tagSlug(name);
      const info = bySlug.get(slug) ?? { name, slug, topics: [] };
      if (!info.topics.includes(t)) info.topics.push(t);
      bySlug.set(slug, info);
    }
  }
  return [...bySlug.values()].sort((a, b) => b.topics.length - a.topics.length || a.name.localeCompare(b.name));
})();

export function findTag(slug: string | undefined): TagInfo | undefined {
  return tags.find((t) => t.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
