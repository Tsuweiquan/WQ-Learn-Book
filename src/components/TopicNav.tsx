import { Link as RouterLink } from "react-router";

import { areaGroups, areaPath, childrenOf, PAGE_TYPE_LABEL, type Topic } from "../lib/topics";

function NavItem({ topic, current, onNavigate }: { topic: Topic; current?: string; onNavigate?: () => void }) {
  const active = topic.id === current;
  return (
    <RouterLink
      to={topic.path}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`block rounded-md px-2 py-1 leading-snug no-underline hover:bg-sky ${
        active ? "bg-sky font-semibold text-accent" : "text-foreground"
      }`}
    >
      {topic.parent && (
        <span className="me-1.5 font-mono text-[10px] tracking-[0.06em] text-muted uppercase">
          {PAGE_TYPE_LABEL[topic.type]}
        </span>
      )}
      {topic.shortTitle}
    </RouterLink>
  );
}

/** Areas → topics → labs and deep dives. Used as the topic page sidebar and in its phone drawer. */
export function TopicNav({ current, onNavigate }: { current?: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Topics" className="grid gap-5 text-[14px]">
      {areaGroups.map(({ area, topics }) => (
        <div key={area.slug} className="grid gap-1">
          <RouterLink
            to={areaPath(area)}
            onClick={onNavigate}
            className="px-2 font-mono text-[11px] tracking-[0.1em] text-muted uppercase no-underline hover:text-accent"
          >
            {area.title}
          </RouterLink>
          <ul className="grid gap-0.5">
            {topics.map((topic) => {
              const children = childrenOf(topic.id);
              return (
                <li key={topic.id}>
                  <NavItem topic={topic} current={current} onNavigate={onNavigate} />
                  {children.length > 0 && (
                    <ul className="ms-3 mt-0.5 grid gap-0.5 border-s border-border ps-1.5">
                      {children.map((child) => (
                        <li key={child.id}>
                          <NavItem topic={child} current={current} onNavigate={onNavigate} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
