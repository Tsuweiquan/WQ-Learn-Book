import { Bars } from "@gravity-ui/icons";
import { Breadcrumbs, Button, Card, Chip, Drawer, Link } from "@heroui/react";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useParams } from "react-router";

import { mdxComponents } from "../components/mdx";
import { PageFooter } from "../components/PageFooter";
import { ProgressChip } from "../components/ProgressChip";
import { TopicNav } from "../components/TopicNav";
import { TagLinks, TopicRow } from "../components/TopicRow";
import { areaPath, childrenOf, findTopic, formatDate, PAGE_TYPE_LABEL, type Topic } from "../lib/topics";
import { NotFoundPage } from "./NotFoundPage";

interface TocPart {
  id: string;
  title: string;
  level: number;
  blocks: { id: string; title: string }[];
}

const DOT: Record<number, string> = { 1: "bg-l1", 2: "bg-l2", 3: "bg-l3", 4: "bg-l4" };

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

function BrowseDrawer({ current }: { current: string }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="tertiary" className="w-fit lg:hidden" onPress={() => setOpen(true)}>
        <Bars />
        Browse topics
      </Button>
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Topics</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <TopicNav current={current} onNavigate={() => setOpen(false)} />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}

/** On a topic: its labs and deep dives. */
function ChildPages({ topic }: { topic: Topic }) {
  const children = childrenOf(topic.id);
  if (children.length === 0) return null;
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="border-b border-border bg-sky px-4.5 py-3">
        <strong>In this topic</strong>
      </div>
      {children.map((child) => (
        <TopicRow key={child.id} topic={child} />
      ))}
    </Card>
  );
}

function TopicView({ topic }: { topic: Topic }) {
  const article = useRef<HTMLElement>(null);
  const toc = useToc(article);
  const parent = findTopic(topic.parent);
  const label = PAGE_TYPE_LABEL[topic.type];
  const { Content } = topic;

  return (
    // The sidebar column grows on wide screens so its 250px list lines up with the 1240px site header,
    // while the page header's background still runs to the right edge.
    <div className="grid w-full flex-1 lg:grid-cols-[max(250px,calc(50vw-370px))_minmax(0,1fr)]">
      <title>{`${topic.shortTitle} · WQ Learn Book`}</title>
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-e border-border py-8 lg:block">
        <div className="ms-auto w-[250px] ps-4 pe-3">
          <TopicNav current={topic.id} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="border-b border-border bg-linear-to-b from-sky to-background">
          <div className="mx-auto grid max-w-[920px] gap-3 px-4 pt-10 pb-8">
            <BrowseDrawer current={topic.id} />
            <Breadcrumbs className="flex-wrap gap-y-1 font-mono text-xs tracking-[0.08em] uppercase">
              <Breadcrumbs.Item href="/">Learn Book</Breadcrumbs.Item>
              <Breadcrumbs.Item href={areaPath(topic.area)}>{topic.area.title}</Breadcrumbs.Item>
              {parent && <Breadcrumbs.Item href={parent.path}>{parent.shortTitle}</Breadcrumbs.Item>}
              <Breadcrumbs.Item>{label}</Breadcrumbs.Item>
            </Breadcrumbs>
            <h1 className="text-[clamp(32px,6vw,52px)] font-extrabold tracking-[-0.02em]">{topic.title}</h1>
            <p className="max-w-[65ch] text-lg text-muted">{topic.summary}</p>
            <div className="flex flex-wrap gap-2">
              {topic.progress && <ProgressChip progress={topic.progress} />}
              {topic.duration && (
                <Chip size="sm" variant="secondary" className="font-mono">
                  {topic.duration}
                </Chip>
              )}
              <Chip size="sm" variant="secondary" className="font-mono">
                Added {formatDate(topic.added)}
              </Chip>
              <TagLinks tags={topic.tags} className="contents" />
            </div>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-[920px] flex-1 gap-14 px-4 pt-8 pb-18">
          <div className="grid gap-6">
            <ChildPages topic={topic} />
            <TableOfContents toc={toc} />
          </div>
          <article ref={article} className="grid gap-14">
            <Content components={mdxComponents} />
          </article>
        </main>

        <PageFooter left={`WQ Learn Book · ${topic.area.title} · ${label}`} right={topic.shortTitle} />
      </div>
    </div>
  );
}

export function TopicPage() {
  const { area, slug, child } = useParams();
  const topic = findTopic([area, slug, child].filter(Boolean).join("/"));
  if (!topic) return <NotFoundPage />;
  // key: rebuild the table of contents when moving between topics.
  return <TopicView key={topic.id} topic={topic} />;
}
