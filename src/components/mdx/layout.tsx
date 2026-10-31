import { Alert, Card, Chip } from "@heroui/react";
import { Children, isValidElement, type ReactNode } from "react";

type Level = 1 | 2 | 3;

const LEVEL_LABEL: Record<Level, string> = {
  1: "High-level architecture",
  2: "Theory",
  3: "Implementation",
};

const LEVEL_BORDER: Record<Level, string> = {
  1: "border-l1",
  2: "border-l2",
  3: "border-l3",
};

/** One of the three altitudes of a topic page. `toc` overrides the title in the table of contents. */
export function Part({
  level,
  id,
  title,
  toc,
  children,
}: {
  level: Level;
  id: string;
  title: string;
  toc?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} data-toc-part={level} data-toc-title={`${level}. ${toc ?? title}`} className="grid gap-7">
      <header className={`grid gap-1.5 border-b-[3px] pb-3 ${LEVEL_BORDER[level]}`}>
        <span className="font-mono text-xs tracking-[0.1em] text-muted uppercase">
          Level {level} · {LEVEL_LABEL[level]}
        </span>
        <h2 className="text-[clamp(26px,4vw,34px)] font-bold">
          {level}. {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

/** A numbered subsection inside a Part. `toc` overrides the title in the table of contents. */
export function Block({ id, title, toc, children }: { id: string; title: string; toc?: string; children: ReactNode }) {
  return (
    <div id={id} data-toc-block data-toc-title={toc ?? title} className="topic-prose">
      <h3 className="text-[22px] font-bold">{title}</h3>
      {children}
    </div>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <div className="topic-prose text-muted">{children}</div>;
}

/** Two cards side by side: <Pros> / <Cons>, or any pair of <InfoCard>s. */
export function Fit({ children }: { children: ReactNode }) {
  return <div className="grid gap-3.5 md:grid-cols-2">{children}</div>;
}

export const Grid = Fit;

function ListCard({ title, tone, children }: { title: string; tone: "good" | "bad"; children: ReactNode }) {
  return (
    <Card className="min-w-0 gap-2">
      <Card.Header>
        <Card.Title
          className={`font-mono text-[15px] font-medium tracking-[0.06em] uppercase ${tone === "good" ? "text-good" : "text-bad"}`}
        >
          {title}
        </Card.Title>
      </Card.Header>
      <Card.Content className="topic-prose text-muted">{children}</Card.Content>
    </Card>
  );
}

export function Pros({ title = "Pros", children }: { title?: string; children: ReactNode }) {
  return (
    <ListCard title={title} tone="good">
      {children}
    </ListCard>
  );
}

export function Cons({ title = "Cons", children }: { title?: string; children: ReactNode }) {
  return (
    <ListCard title={title} tone="bad">
      {children}
    </ListCard>
  );
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="min-w-0 gap-2">
      <Card.Header>
        <Card.Title className="text-[17px] font-bold">{title}</Card.Title>
      </Card.Header>
      <Card.Content className="topic-prose text-muted">{children}</Card.Content>
    </Card>
  );
}

function Callout({
  status,
  title,
  children,
}: {
  status: "warning" | "accent";
  title?: string;
  children: ReactNode;
}) {
  return (
    <Alert status={status}>
      <Alert.Indicator />
      <Alert.Content>
        {title && <Alert.Title>{title}</Alert.Title>}
        {/* Alert.Description renders a <span>; MDX children can be paragraphs, so keep its class on a <div>. */}
        <div className="alert__description topic-prose gap-1.5">{children}</div>
      </Alert.Content>
    </Alert>
  );
}

/** Caveats and unverified claims ("Unsure", "Check before use"). */
export function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Callout status="warning" title={title}>
      {children}
    </Callout>
  );
}

/** Pointers and "what working looks like". */
export function Tip({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Callout status="accent" title={title}>
      {children}
    </Callout>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  const steps = Children.toArray(children).filter(isValidElement);
  return (
    <ol className="grid max-w-none list-none gap-5 p-0">
      {steps.map((step, i) => (
        <li key={i} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3.5">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-full bg-l3 font-display font-bold text-accent-foreground"
          >
            {i + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

export function Step({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="topic-prose">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

/** A list of pass criteria, drawn as empty check boxes. */
export function Checklist({ children }: { children: ReactNode }) {
  return <div className="checklist">{children}</div>;
}

/** Inline colour label, e.g. <Pill color="blue">blue</Pill>. */
export function Pill({ color, children }: { color: "blue" | "green"; children: ReactNode }) {
  return (
    <Chip size="sm" variant="soft" color={color === "blue" ? "accent" : "success"} className="align-middle font-mono">
      {children}
    </Chip>
  );
}
