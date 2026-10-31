import type { MDXProps } from "mdx/types";
import type { ComponentType } from "react";

export interface TopicFrontmatter {
  /** Index number shown in the topic list, e.g. "02" or "02a" for a lab under topic 02. */
  number: string;
  title: string;
  /** Used in breadcrumbs, the footer and the browser tab. */
  shortTitle: string;
  /** Lede under the page title. */
  summary: string;
  /** One line under the title in the home page's topic index. */
  indexSummary: string;
  area: string;
  /** YYYY-MM-DD */
  added: string;
  tags: string[];
  /** Slug of the topic this page belongs to, for labs and other subtopics. */
  parent?: string;
}

export interface Topic extends TopicFrontmatter {
  slug: string;
  Content: ComponentType<MDXProps>;
}

const modules = import.meta.glob<{ default: ComponentType<MDXProps>; frontmatter: TopicFrontmatter }>(
  "../../content/topics/*.mdx",
  { eager: true },
);

export const topics: Topic[] = Object.entries(modules)
  .map(([path, mod]) => ({
    ...mod.frontmatter,
    slug: path.slice(path.lastIndexOf("/") + 1, -".mdx".length),
    Content: mod.default,
  }))
  .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

export function findTopic(slug: string | undefined): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}

export function topicPath(slug: string): string {
  return `/topics/${slug}`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
