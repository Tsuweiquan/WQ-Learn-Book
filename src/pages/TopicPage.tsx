import { Breadcrumbs, Card, Chip, Link } from "@heroui/react";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useParams } from "react-router";

import { mdxComponents } from "../components/mdx";
import { PageFooter } from "../components/PageFooter";
import { findTopic, formatDate, topicPath, type Topic } from "../lib/topics";
import { NotFoundPage } from "./NotFoundPage";

interface TocPart {
  id: string;
  title: string;
  level: number;
  blocks: { id: string; title: string }[];
}

const DOT: Record<number, string> = { 1: "bg-l1", 2: "bg-l2", 3: "bg-l3" };

// Builds the table of contents from the <Part> and <Block> elements the MDX rendered.
function useToc(root: RefObject<HTMLElement | null>): TocPart[] {
  const [toc, setToc] = useState<TocPart[]>([]);
  useLayoutEffect(() => {
    const parts = root.current?.querySelectorAll<HTMLElement>("[data-toc-part]") ?? [];
    setToc(
      [...parts].map((part) => ({
        id: part.id,
        title: part.dataset.tocTitle ?? "",
        level: Number(part.dataset.tocPart),
        blocks: [...part.querySelectorAll<HTMLElement>("[data-toc-block]")].map((b) => ({
          id: b.id,
          title: b.dataset.tocTitle ?? "",
        })),
      })),
    );
  }, [root]);
  return toc;
}

function TableOfContents({ toc }: { toc: TocPart[] }) {
  if (toc.length === 0) return null;
  return (
    <Card render={(props) => <nav {...props} aria-label="Table of contents" />} className="gap-3">
      <Card.Header>
        <Card.Title className="font-mono text-[13px] font-medium tracking-[0.1em] text-muted uppercase">
          Table of contents
        </Card.Title>
      </Card.Header>
      <Card.Content className="grid gap-4 md:grid-cols-3">
        {toc.map((part) => (
          <div key={part.id} className="min-w-0">
            <h3 className="mb-1.5 flex items-center gap-2 text-base">
              <span className={`size-2.5 flex-none rounded-[3px] ${DOT[part.level] ?? "bg-l1"}`} />
              <Link href={`#${part.id}`} className="text-foreground">
                {part.title}
              </Link>
            </h3>
            <ol className="grid gap-0.5">
              {part.blocks.map((b) => (
                <li key={b.id}>
                  <Link href={`#${b.id}`} className="text-[15px] text-foreground no-underline hover:text-accent">
                    {b.title}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}

function TopicView({ topic }: { topic: Topic }) {
  const article = useRef<HTMLElement>(null);
  const toc = useToc(article);
  const parent = findTopic(topic.parent);
  const label = parent ? `Subtopic ${topic.number}` : `Topic ${topic.number}`;
  const { Content } = topic;

  return (
    <>
      <title>{`${topic.shortTitle} · WQ Learn Book`}</title>
      <header className="border-b border-border bg-linear-to-b from-sky to-background">
        <div className="mx-auto grid max-w-[920px] gap-3 px-4 pt-10 pb-8">
          <Breadcrumbs className="flex-wrap gap-y-1 font-mono text-xs tracking-[0.08em] uppercase">
            <Breadcrumbs.Item href="/">Learn Book</Breadcrumbs.Item>
            {parent && (
              <Breadcrumbs.Item href={topicPath(parent.slug)}>
                Topic {parent.number} · {parent.shortTitle}
              </Breadcrumbs.Item>
            )}
            <Breadcrumbs.Item>
              {label} · {topic.area}
            </Breadcrumbs.Item>
          </Breadcrumbs>
          <h1 className="text-[clamp(32px,6vw,52px)] font-extrabold tracking-[-0.02em]">{topic.title}</h1>
          <p className="max-w-[65ch] text-lg text-muted">{topic.summary}</p>
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" variant="secondary" className="font-mono">
              Added {formatDate(topic.added)}
            </Chip>
            {topic.tags.map((tag) => (
              <Chip key={tag} size="sm" variant="secondary" className="font-mono">
                {tag}
              </Chip>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[920px] flex-1 gap-14 px-4 pt-8 pb-18">
        <TableOfContents toc={toc} />
        <article ref={article} className="grid gap-14">
          <Content components={mdxComponents} />
        </article>
      </main>

      <PageFooter left={`WQ Learn Book · ${label}`} right={topic.shortTitle} />
    </>
  );
}

export function TopicPage() {
  const { slug } = useParams();
  const topic = findTopic(slug);
  if (!topic) return <NotFoundPage />;
  // key: rebuild the table of contents when moving between topics.
  return <TopicView key={topic.slug} topic={topic} />;
}
