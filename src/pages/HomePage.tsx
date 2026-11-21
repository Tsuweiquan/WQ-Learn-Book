import { ArrowUpRightFromSquare, ChevronRight } from "@gravity-ui/icons";
import { Card, Chip, Link } from "@heroui/react";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { PageFooter } from "../components/PageFooter";
import { TopicRow } from "../components/TopicRow";
import { areaGroups, childrenOf, formatDate, tags, topics } from "../lib/topics";

const LEVELS = [
  {
    code: "L1",
    color: "bg-l1",
    title: "Architecture",
    lead: "Several reference architectures, each with a diagram, and when to choose which.",
  },
  {
    code: "L2",
    color: "bg-l2",
    title: "Theory",
    lead: "What it is, why the industry does it this way, the problems it solves, the trade-offs.",
  },
  {
    code: "L3",
    color: "bg-l3",
    title: "Implementation",
    lead: "Runnable code and config, tested on a laptop, with expected output.",
  },
];

const PARTS: { key: string; value: ReactNode }[] = [
  { key: "Header", value: "Title, one-line summary, date added, area, tags." },
  { key: "Table of contents", value: "Always at the top, built from the Parts and Blocks below." },
  {
    key: "§1 Architecture",
    value: (
      <>
        <strong className="text-foreground">Multiple</strong> architecture examples, each with a diagram, components
        and flow, then a comparison: when to choose which.
      </>
    ),
  },
  { key: "§2 Theory", value: "What it is, why the industry does it this way, the problems it solves, pros and cons." },
  { key: "§3 Implementation", value: "Runnable code and config, a way to test it on a laptop, expected output, cleanup." },
  { key: "References", value: "Links to the official docs and sources used for the page." },
  { key: "§4 Self implementation", value: "Optional: links to my own lab notes in the Practical Book, what's done, what differed." },
];

const PAGE_TYPES: { type: string; where: string; lead: string; parts: { key: string; value: ReactNode }[] }[] = [
  {
    type: "Topic",
    where: "content/<area>/<slug>.mdx",
    lead: "A subject of its own, learned top-down.",
    parts: PARTS,
  },
  {
    type: "Lab",
    where: "content/<area>/<topic>/<slug>.mdx",
    lead: "A hands-on run of its parent topic, step by step on one machine.",
    parts: [
      { key: "§1 Lab architecture", value: "The host and what runs on it, with a diagram per lab." },
      { key: "§2 What the tests prove", value: "Goals, how they're measured, pass criteria." },
      { key: "§3 Run the lab", value: "Prepare the machine, numbered steps, what \"working\" looks like, cleanup." },
      { key: "References", value: "Docs for every tool and version used." },
      { key: "§4 Self implementation", value: "Optional: my own run, as for a topic." },
    ],
  },
  {
    type: "Deep dive",
    where: "content/<area>/<topic>/<slug>.mdx",
    lead: "One part of its parent topic in depth. It builds on the parent's setup instead of repeating it.",
    parts: [
      { key: "Builds on", value: "A note at the top: which parent sections and labs it assumes." },
      { key: "§1–§3", value: "The full topic outline (architecture, theory, implementation), scoped to that one part." },
      { key: "References", value: "As for a topic." },
    ],
  },
];

const RULES = [
  {
    title: "Sourced, not guessed",
    body: "Content comes from documented, established practice. Anything uncertain is marked as uncertain.",
  },
  { title: "Technical first", body: "Written for an engineer: precise terms, real config, no filler." },
  { title: "Runnable locally", body: "Every implementation section ends with a way to test it on a laptop." },
  {
    title: "Corrections welcome",
    body: "Wrong assumptions get called out and fixed, on the page and in the conversation.",
  },
];

const READS = [
  {
    title: "The Pragmatic Engineer",
    by: "Gergely Orosz · Substack",
    kind: "Newsletter",
    href: "https://newsletter.pragmaticengineer.com/",
    body: "Big Tech and startups, from the inside. Written for software engineers, AI engineers and engineering leaders.",
  },
  {
    title: "Site Reliability Engineering, 2nd Edition",
    by: "Google SRE · book",
    kind: "Book",
    href: "https://sre.google/books/",
    body: "A completely rewritten edition of the SRE book: Google's current SRE practices, cloud reliability and the impact of AI. The same page links the first edition and the SRE Workbook to read online.",
  },
  {
    title: "CNCF Landscape",
    by: "Cloud Native Computing Foundation",
    kind: "Reference",
    href: "https://landscape.cncf.io/",
    body: "A map of cloud native projects and products, grouped by category. Check what exists and what competes before picking a tool.",
  },
];

const SECTIONS = [
  { id: "method", label: "1. Learning method" },
  { id: "topics", label: "2. Topic index" },
  { id: "practical", label: "3. Practical book" },
  { id: "reads", label: "4. Good reads" },
  { id: "template", label: "5. Page types" },
  { id: "rules", label: "6. House rules" },
  { id: "landscape", label: "7. CNCF Landscape" },
];

const LANDSCAPE_URL = "https://landscape.cncf.io/?view-mode=grid";

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-[clamp(26px,4vw,34px)] font-bold">{children}</h2>;
}

export function HomePage() {
  const topicCount = topics.filter((t) => !t.parent).length;
  const childCount = topics.length - topicCount;
  const started = topics.map((t) => t.added).sort()[0];

  return (
    <>
      <title>WQ Learn Book</title>
      <header className="border-b border-border bg-linear-to-b from-sky to-background">
        <div className="mx-auto grid max-w-[920px] gap-4 px-4 pt-14 pb-10">
          <p className="font-mono text-xs tracking-[0.12em] text-accent uppercase">Personal technical notebook</p>
          <h1 className="text-[clamp(40px,8vw,72px)] font-extrabold tracking-[-0.02em]">
            WQ <span className="text-accent">Learn</span> Book
          </h1>
          <p className="max-w-[62ch] text-[19px] text-muted">
            One page per topic, learned top-down: see how real systems are shaped, understand why the industry builds
            them that way, then build and test it on your own machine.
          </p>
          <div className="flex flex-wrap gap-2">
            {started && (
              <Chip size="sm" variant="secondary" className="font-mono">
                Started {formatDate(started)}
              </Chip>
            )}
            <Chip size="sm" variant="secondary" className="font-mono">
              {topicCount} {topicCount === 1 ? "topic" : "topics"}
            </Chip>
            {childCount > 0 && (
              <Chip size="sm" variant="secondary" className="font-mono">
                {childCount} {childCount === 1 ? "lab or deep dive" : "labs and deep dives"}
              </Chip>
            )}
            <Chip size="sm" variant="secondary" className="font-mono">
              Architecture → Theory → Implementation
            </Chip>
          </div>
          <nav aria-label="Contents" className="flex flex-wrap gap-x-5 gap-y-1 pt-2">
            {SECTIONS.map((s) => (
              <Link key={s.id} href={`#${s.id}`} className="font-semibold text-foreground">
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[920px] flex-1 gap-16 px-4 pt-12 pb-18">
        <section id="method" className="grid gap-4">
          <SectionHeading>1. Learning method</SectionHeading>
          <p className="max-w-[65ch] text-muted">Every topic is learned top-down, always in this order.</p>
          <ol className="grid gap-3 md:grid-cols-3">
            {LEVELS.map((level) => (
              <li key={level.code} className="grid">
                <Card className="gap-1.5 p-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold text-accent-foreground ${level.color}`}
                    >
                      {level.code}
                    </span>
                    <h3 className="text-[17px] font-bold">{level.title}</h3>
                  </div>
                  <p className="text-sm text-muted">{level.lead}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section id="topics" className="grid gap-5">
          <SectionHeading>2. Topic index</SectionHeading>
          <p className="max-w-[65ch] text-muted">
            Topics grouped by area, with their labs and deep dives under them. A new MDX file in{" "}
            <code className="font-mono text-sm">content/&lt;area&gt;/</code> shows up here automatically. Browse by{" "}
            <Link href="/tags" className="text-accent">
              tag
            </Link>{" "}
            ({tags.length}), or search with <kbd className="font-mono text-sm">Ctrl K</kbd>.
          </p>
          <nav aria-label="Areas" className="flex flex-wrap gap-2">
            {areaGroups.map(({ area }) => (
              <Link key={area.slug} href={`#area-${area.slug}`} className="no-underline">
                <Chip size="sm" variant="secondary" className="font-mono hover:bg-sky-2">
                  {area.title}
                </Chip>
              </Link>
            ))}
          </nav>
          {areaGroups.map(({ area, topics: areaTopics }) => (
            <Card key={area.slug} id={`area-${area.slug}`} className="scroll-mt-20 gap-0 overflow-hidden p-0">
              <div className="grid gap-0.5 border-b border-border bg-sky px-4.5 py-3.5">
                <div className="flex justify-between gap-3">
                  <h3 className="text-lg font-bold">{area.title}</h3>
                  <span className="font-mono text-xs text-muted">
                    {areaTopics.length} {areaTopics.length === 1 ? "topic" : "topics"}
                  </span>
                </div>
                {area.blurb && <p className="text-sm text-muted">{area.blurb}</p>}
              </div>
              {areaTopics.map((t) => (
                <div key={t.id} className="border-b border-border last:border-b-0 [&>a]:border-b-0">
                  <TopicRow topic={t} />
                  {childrenOf(t.id).map((child) => (
                    <div key={child.id} className="border-t border-dashed border-border">
                      <TopicRow topic={child} nested />
                    </div>
                  ))}
                </div>
              ))}
            </Card>
          ))}
        </section>

        <section id="practical" className="grid gap-5">
          <SectionHeading>3. Practical book</SectionHeading>
          <p className="max-w-[65ch] text-muted">
            Hands-on setups: app code, Dockerfiles and their guides, shown straight from{" "}
            <code className="font-mono text-sm">wq_practical_book/</code>.
          </p>
          <RouterLink
            to="/practical"
            className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4.5 py-3.5 font-bold text-foreground no-underline hover:bg-sky"
          >
            Browse the Practical Book
            <ChevronRight className="flex-none text-muted" />
          </RouterLink>
        </section>

        <section id="reads" className="grid gap-5">
          <SectionHeading>4. Good reads</SectionHeading>
          <p className="max-w-[65ch] text-muted">Sources to keep up to date between topics.</p>
          <div className="grid gap-3.5 md:grid-cols-3">
            {READS.map((read) => (
              <Card key={read.href} className="gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[17px] leading-snug font-bold">{read.title}</h3>
                  <Chip size="sm" variant="secondary" className="flex-none font-mono">
                    {read.kind}
                  </Chip>
                </div>
                <p className="font-mono text-xs text-muted">{read.by}</p>
                <p className="flex-1 text-base text-muted">{read.body}</p>
                <Link
                  href={read.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-fit text-sm font-semibold text-accent"
                >
                  {new URL(read.href).hostname}
                  <ArrowUpRightFromSquare className="ms-1 inline size-3.5" />
                </Link>
              </Card>
            ))}
          </div>
        </section>

        <section id="template" className="grid gap-5">
          <SectionHeading>5. Page types</SectionHeading>
          <p className="max-w-[65ch] text-muted">
            Every page is one of three types, and each type has a fixed outline, so any page can be skimmed the same
            way. Labs and deep dives live in their parent topic's folder and are listed under it.
          </p>
          {PAGE_TYPES.map((pt) => (
            <Card key={pt.type} className="gap-0 p-0">
              <div className="grid gap-1 border-b border-border px-4.5 py-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-lg font-bold">{pt.type}</h3>
                  <code className="font-mono text-xs break-all text-muted">{pt.where}</code>
                </div>
                <p className="text-sm text-muted">{pt.lead}</p>
              </div>
              <dl>
                {pt.parts.map((row, i) => (
                  <div
                    key={row.key}
                    className={`grid gap-1.5 px-4.5 py-3.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-4 ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <dt className="font-mono text-[13px] font-medium text-accent">{row.key}</dt>
                    <dd className="min-w-0 text-muted">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </section>

        <section id="rules" className="grid gap-5">
          <SectionHeading>6. House rules</SectionHeading>
          <div className="grid gap-3.5 md:grid-cols-2">
            {RULES.map((rule) => (
              <Card key={rule.title} variant="secondary" className="gap-1.5">
                <Card.Header>
                  <Card.Title className="text-[17px] font-bold">{rule.title}</Card.Title>
                </Card.Header>
                <Card.Content>
                  <p className="text-base text-muted">{rule.body}</p>
                </Card.Content>
              </Card>
            ))}
          </div>
        </section>

        <section id="landscape" className="grid gap-5">
          <SectionHeading>7. CNCF Landscape</SectionHeading>
          <p className="max-w-[65ch] text-muted">
            The live grid of cloud native projects and products, by category. Check what exists and what competes
            before picking a tool.
          </p>
          <Card className="overflow-hidden p-0">
            <iframe
              src={LANDSCAPE_URL}
              title="CNCF Landscape, grid view"
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              className="block h-[min(80vh,780px)] w-full border-0 bg-white"
            />
          </Card>
          <Link
            href={LANDSCAPE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-sm font-semibold text-accent"
          >
            Open the full landscape at landscape.cncf.io
            <ArrowUpRightFromSquare className="ms-1 inline size-3.5" />
          </Link>
        </section>
      </main>

      <PageFooter left="WQ Learn Book" right="v3 · areas" />
    </>
  );
}
