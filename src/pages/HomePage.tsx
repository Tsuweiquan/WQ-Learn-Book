import { ChevronRight } from "@gravity-ui/icons";
import { Card, Chip, Link } from "@heroui/react";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router";

import { PageFooter } from "../components/PageFooter";
import { formatDate, topicPath, topics } from "../lib/topics";

const LEVELS = [
  {
    code: "L1",
    altitude: "High",
    color: "bg-l1",
    title: "High-level architecture",
    lead: "Several reference architectures for the topic, side by side.",
    points: [
      "Diagram of each architecture with its main components and data flow",
      "When each one fits: scale, team size, cost, cloud (AWS / GCP) mapping",
      "What changes between them and why",
    ],
  },
  {
    code: "L2",
    altitude: "Mid",
    color: "bg-l2",
    title: "Theory",
    lead: "What the topic is, in depth, and why the industry does it this way.",
    points: [
      "Core concepts and vocabulary",
      "The problems it solves, and what came before it",
      "Common pros and cons, with trade-offs stated plainly",
    ],
  },
  {
    code: "L3",
    altitude: "Ground",
    color: "bg-l3",
    title: "Implementation",
    lead: "Concrete examples you can run, plus a way to verify them locally.",
    points: [
      "Code and config examples (Terraform, YAML, scripts as relevant)",
      "A local test method, e.g. kind, docker compose, emulators",
      'What "working" looks like: expected output and checks',
    ],
  },
];

const TEMPLATE: { key: string; value: ReactNode }[] = [
  { key: "Header", value: <><strong className="text-foreground">Topic name</strong>, one-line summary, date added, area tag.</> },
  { key: "Table of contents", value: "Always at the top, linking to every section below." },
  {
    key: "§1 Architecture",
    value: (
      <>
        <strong className="text-foreground">Multiple</strong> architecture examples:
        <ol className="mt-1 list-decimal pl-5">
          <li>Architecture A: diagram, components, flow</li>
          <li>Architecture B: diagram, components, flow</li>
          <li>Comparison: when to choose which</li>
        </ol>
      </>
    ),
  },
  {
    key: "§2 Theory",
    value: (
      <ul className="list-disc pl-5">
        <li>What it is</li>
        <li>Why the industry does it this way</li>
        <li>Problems it solves</li>
        <li>Pros and cons</li>
      </ul>
    ),
  },
  {
    key: "§3 Implementation",
    value: (
      <ul className="list-disc pl-5">
        <li>Step-by-step example with code</li>
        <li>How to test it locally</li>
        <li>Expected results and cleanup</li>
      </ul>
    ),
  },
  { key: "References", value: "Links to official docs and sources used for the page." },
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

const SECTIONS = [
  { id: "method", label: "1. Learning method" },
  { id: "topics", label: "2. Topic index" },
  { id: "practical", label: "3. Practical book" },
  { id: "template", label: "4. Page template" },
  { id: "rules", label: "5. House rules" },
];

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-[clamp(26px,4vw,34px)] font-bold">{children}</h2>;
}

export function HomePage() {
  const topicCount = topics.filter((t) => !t.parent).length;
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
        <section id="method" className="grid gap-5">
          <SectionHeading>1. Learning method</SectionHeading>
          <p className="max-w-[65ch] text-muted">
            Every topic is studied at three altitudes, always in this order. Start wide to see the shape, drop into the
            reasoning, then land on working code.
          </p>
          <div className="grid gap-3.5">
            {LEVELS.map((level) => (
              <Card key={level.code} className="grid gap-4 p-5 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-5">
                <div
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-[11px] tracking-[0.06em] text-accent-foreground uppercase sm:grid sm:place-items-center sm:content-center sm:gap-0.5 sm:px-1 sm:py-2.5 ${level.color}`}
                >
                  <b className="font-display text-lg leading-none tracking-normal sm:text-[26px]">{level.code}</b>
                  {level.altitude}
                </div>
                <div className="grid min-w-0 gap-2">
                  <h3 className="text-[21px] font-bold">{level.title}</h3>
                  <p>{level.lead}</p>
                  <ul className="list-disc pl-5 text-muted">
                    {level.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="topics" className="grid gap-5">
          <SectionHeading>2. Topic index</SectionHeading>
          <p className="max-w-[65ch] text-muted">
            Each topic gets its own page. A new MDX file in <code className="font-mono text-sm">content/topics/</code>{" "}
            shows up here automatically.
          </p>
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex justify-between gap-3 border-b border-border bg-sky px-4.5 py-3.5">
              <strong>Topics</strong>
              <span className="font-mono text-xs text-muted">
                {topics.length} {topics.length === 1 ? "page" : "pages"}
              </span>
            </div>
            <div className="hidden grid-cols-[2fr_1fr_1fr_20px] gap-3 border-b border-border px-4.5 py-2.5 font-mono text-[11px] tracking-[0.08em] text-muted uppercase sm:grid">
              <span>Topic</span>
              <span>Area</span>
              <span>Added</span>
            </div>
            {topics.map((t) => (
              <RouterLink
                key={t.slug}
                to={topicPath(t.slug)}
                className="grid items-start gap-1 border-b border-border px-4.5 py-3.5 text-foreground no-underline last:border-b-0 hover:bg-sky sm:grid-cols-[2fr_1fr_1fr_20px] sm:gap-3"
              >
                <span className={`grid min-w-0 gap-0.5 ${t.parent ? "sm:ps-5" : ""}`}>
                  <b>
                    {t.parent && "↳ "}
                    {t.number} · {t.title}
                  </b>
                  <small className="text-sm text-muted">{t.indexSummary}</small>
                </span>
                <span className="font-mono text-[13px] text-muted">{t.area}</span>
                <span className="font-mono text-[13px] text-muted">{formatDate(t.added)}</span>
                <ChevronRight className="hidden self-center text-muted sm:block" />
              </RouterLink>
            ))}
          </Card>
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

        <section id="template" className="grid gap-5">
          <SectionHeading>4. Page template</SectionHeading>
          <p className="max-w-[65ch] text-muted">
            Every topic page follows this exact outline, so any page can be skimmed the same way.
          </p>
          <Card className="gap-0 p-0">
            <dl>
              {TEMPLATE.map((row, i) => (
                <div
                  key={row.key}
                  className={`grid gap-1.5 px-4.5 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <dt className="font-mono text-[13px] font-medium text-accent">{row.key}</dt>
                  <dd className="min-w-0 text-muted">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>

        <section id="rules" className="grid gap-5">
          <SectionHeading>5. House rules</SectionHeading>
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
      </main>

      <PageFooter left="WQ Learn Book" right="v2 · HeroUI" />
    </>
  );
}
