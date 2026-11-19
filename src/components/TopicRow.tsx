import { ChevronRight } from "@gravity-ui/icons";
import { Chip } from "@heroui/react";
import { Link as RouterLink } from "react-router";

import { formatDate, PAGE_TYPE_LABEL, tagPath, type Topic } from "../lib/topics";
import { ProgressChip } from "./ProgressChip";

/** A page's tags as links to their tag pages. */
export function TagLinks({ tags, className = "" }: { tags: string[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <RouterLink key={tag} to={tagPath(tag)} className="no-underline">
          <Chip size="sm" variant="secondary" className="font-mono hover:bg-sky-2">
            {tag}
          </Chip>
        </RouterLink>
      ))}
    </div>
  );
}

/** One row of a topic list (home page index, tag pages). `nested` indents a lab or deep dive. */
export function TopicRow({ topic, nested = false, showArea = false }: { topic: Topic; nested?: boolean; showArea?: boolean }) {
  return (
    <RouterLink
      to={topic.path}
      className={`grid items-start gap-1 border-b border-border px-4.5 py-3.5 text-foreground no-underline last:border-b-0 hover:bg-sky sm:grid-cols-[minmax(0,1fr)_110px_20px] sm:gap-3 ${
        nested ? "sm:ps-10" : ""
      }`}
    >
      <span className="grid min-w-0 gap-1">
        {(nested || showArea || topic.type !== "topic") && (
          <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
            {nested && "↳ "}
            {showArea && `${topic.area.title} · `}
            {PAGE_TYPE_LABEL[topic.type]}
            {topic.duration && ` · ${topic.duration}`}
          </span>
        )}
        <b className="leading-snug">{topic.title}</b>
        {topic.progress && <ProgressChip progress={topic.progress} className="w-fit" />}
        <small className="text-sm text-muted">{topic.indexSummary}</small>
      </span>
      <span className="font-mono text-[13px] text-muted">{formatDate(topic.added)}</span>
      <ChevronRight className="hidden self-center text-muted sm:block" />
    </RouterLink>
  );
}
