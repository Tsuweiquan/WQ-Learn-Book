import { Breadcrumbs, Card, Chip } from "@heroui/react";
import { Link as RouterLink, useParams } from "react-router";

import { PageFooter } from "../components/PageFooter";
import { TopicRow } from "../components/TopicRow";
import { findTag, tags } from "../lib/topics";
import { NotFoundPage } from "./NotFoundPage";

function Header({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede: string }) {
  return (
    <header className="border-b border-border bg-linear-to-b from-sky to-background">
      <div className="mx-auto grid max-w-[920px] gap-3 px-4 pt-10 pb-8">
        <Breadcrumbs className="flex-wrap gap-y-1 font-mono text-xs tracking-[0.08em] uppercase">
          <Breadcrumbs.Item href="/">Learn Book</Breadcrumbs.Item>
          {eyebrow ? <Breadcrumbs.Item href="/tags">Tags</Breadcrumbs.Item> : <Breadcrumbs.Item>Tags</Breadcrumbs.Item>}
          {eyebrow && <Breadcrumbs.Item>{eyebrow}</Breadcrumbs.Item>}
        </Breadcrumbs>
        <h1 className="text-[clamp(32px,6vw,52px)] font-extrabold tracking-[-0.02em]">{title}</h1>
        <p className="max-w-[65ch] text-lg text-muted">{lede}</p>
      </div>
    </header>
  );
}

/** /tags: every tag with its page count. */
export function TagsPage() {
  return (
    <>
      <title>Tags · WQ Learn Book</title>
      <Header title="Tags" lede={`${tags.length} tags across every topic, lab and deep dive. Most used first.`} />
      <main className="mx-auto w-full max-w-[920px] flex-1 px-4 pt-8 pb-18">
        <ul className="flex flex-wrap gap-2.5">
          {tags.map((tag) => (
            <li key={tag.slug}>
              <RouterLink
                to={`/tags/${tag.slug}`}
                className="flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 font-semibold text-foreground no-underline hover:bg-sky"
              >
                {tag.name}
                <Chip size="sm" variant="secondary" className="font-mono">
                  {tag.topics.length}
                </Chip>
              </RouterLink>
            </li>
          ))}
        </ul>
      </main>
      <PageFooter left="WQ Learn Book · Tags" right={`${tags.length} tags`} />
    </>
  );
}

/** /tags/:tag: every page with that tag. */
export function TagPage() {
  const tag = findTag(useParams().tag);
  if (!tag) return <NotFoundPage />;
  const count = tag.topics.length;
  return (
    <>
      <title>{`${tag.name} · WQ Learn Book`}</title>
      <Header eyebrow={tag.name} title={tag.name} lede={`${count} ${count === 1 ? "page" : "pages"} tagged ${tag.name}.`} />
      <main className="mx-auto w-full max-w-[920px] flex-1 px-4 pt-8 pb-18">
        <Card className="gap-0 overflow-hidden p-0">
          {tag.topics.map((t) => (
            <TopicRow key={t.id} topic={t} showArea />
          ))}
        </Card>
      </main>
      <PageFooter left="WQ Learn Book · Tags" right={tag.name} />
    </>
  );
}
