import { ArrowUpRightFromSquare, File, Folder } from "@gravity-ui/icons";
import { Card, Link } from "@heroui/react";
import type { MDXComponents } from "mdx/types";
import { Children, isValidElement, useMemo, type ComponentProps, type ReactNode } from "react";
import { Link as RouterLink, useParams } from "react-router";

import { mdxComponents } from "../components/mdx";
import { CodeBlock } from "../components/mdx/CodeBlock";
import { PageFooter } from "../components/PageFooter";
import {
  buildTree,
  findPracticalFile,
  githubUrl,
  practicalGuides,
  practicalPath,
  resolvePracticalLink,
  type PracticalFile,
  type TreeFolder,
} from "../lib/practical";
import { NotFoundPage } from "./NotFoundPage";

const tree = buildTree();

function FolderItems({ folder, current }: { folder: TreeFolder; current?: string }) {
  return (
    <ul className="grid gap-0.5">
      {folder.folders.map((child) => (
        <li key={child.name} className="grid min-w-0 gap-0.5">
          <span className="flex items-start gap-1.5 py-0.5 text-muted">
            <Folder className="mt-0.5 flex-none" />
            <span className="min-w-0 wrap-anywhere">{child.name}</span>
          </span>
          <div className="ms-1.5 border-s border-border ps-1.5">
            <FolderItems folder={child} current={current} />
          </div>
        </li>
      ))}
      {folder.files.map((file) => (
        <li key={file.path} className="min-w-0">
          <RouterLink
            to={practicalPath(file.path)}
            aria-current={file.path === current ? "page" : undefined}
            className={`flex items-start gap-1.5 rounded-md px-1 py-0.5 no-underline hover:bg-sky ${
              file.path === current ? "bg-sky font-semibold text-accent" : "text-foreground"
            }`}
          >
            <File className="mt-0.5 flex-none" />
            <span className="min-w-0 wrap-anywhere">{file.name}</span>
          </RouterLink>
        </li>
      ))}
    </ul>
  );
}

function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      return isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : "";
    })
    .join("");
}

// GitHub's heading ids, so links written for a README on GitHub work here too.
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

function heading(Tag: "h2" | "h3" | "h4", className: string) {
  return ({ children }: ComponentProps<"h2">) => (
    <Tag id={slugify(textOf(children))} className={`scroll-mt-20 ${className}`}>
      {children}
    </Tag>
  );
}

const headings: MDXComponents = {
  // The page header already shows the file, but keep the README's own title as its lead heading.
  h1: heading("h2", "text-[clamp(26px,4vw,34px)] font-bold"),
  h2: heading("h3", "pt-4 text-[22px] font-bold"),
  h3: heading("h4", "pt-2"),
};

function FileView({ file }: { file: PracticalFile }) {
  const { Doc, path, lang, html } = file;
  const components = useMemo<MDXComponents>(() => {
    const MdxLink = mdxComponents.a as (props: ComponentProps<"a">) => ReactNode;
    return {
      ...mdxComponents,
      ...headings,
      a: ({ href = "", children }) => <MdxLink href={resolvePracticalLink(path, href)}>{children}</MdxLink>,
    };
  }, [path]);

  return Doc ? (
    <article className="topic-prose min-w-0">
      <Doc components={components} />
    </article>
  ) : (
    <CodeBlock data-title={file.name} data-lang={lang} className="shiki">
      <code dangerouslySetInnerHTML={{ __html: html ?? "" }} />
    </CodeBlock>
  );
}

function Landing() {
  return (
    <div className="grid min-w-0 content-start gap-3.5">
      <h2 className="text-[22px] font-bold">Guides</h2>
      {practicalGuides.map((guide) => (
        <RouterLink key={guide.path} to={practicalPath(guide.path)} className="text-foreground no-underline">
          <Card variant="secondary" className="gap-1 hover:bg-sky">
            <Card.Header>
              <Card.Title className="font-mono text-sm font-medium break-all text-accent">{guide.path}</Card.Title>
            </Card.Header>
          </Card>
        </RouterLink>
      ))}
    </div>
  );
}

export function PracticalPage() {
  const path = useParams()["*"] ?? "";
  const file = path ? findPracticalFile(path) : undefined;
  if (path && !file) return <NotFoundPage />;

  return (
    <>
      <title>{`${file ? file.name : "Practical Book"} · WQ Learn Book`}</title>
      <header className="border-b border-border bg-linear-to-b from-sky to-background">
        <div className="mx-auto grid max-w-[920px] gap-3 px-4 pt-10 pb-8">
          <p className="font-mono text-xs tracking-[0.12em] text-accent uppercase">
            {file ? <RouterLink to="/practical">Practical Book</RouterLink> : "Hands-on setups"}
          </p>
          {file ? (
            <>
              <h1 className="font-mono text-[clamp(20px,4vw,30px)] font-bold wrap-anywhere">{file.path}</h1>
              <Link
                href={githubUrl(file.path)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-sm text-accent"
              >
                View on GitHub
                <ArrowUpRightFromSquare className="ms-1 inline size-3.5" />
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-[clamp(32px,6vw,52px)] font-extrabold tracking-[-0.02em]">Practical Book</h1>
              <p className="max-w-[65ch] text-lg text-muted">
                Hands-on setups, shown straight from the{" "}
                <code className="font-mono text-base">wq_practical_book/</code> folder. Every push to{" "}
                <code className="font-mono text-base">main</code> republishes them, so this always matches the code.
              </p>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[920px] flex-1 content-start gap-8 px-4 pt-8 pb-18 md:grid-cols-[270px_minmax(0,1fr)]">
        {/* Below the file on a phone, so the file is what you see first. */}
        <nav aria-label="Files" className="order-last min-w-0 text-[13px] md:order-first">
          <h2 className="mb-2 font-mono text-[13px] font-medium tracking-[0.1em] text-muted uppercase">Files</h2>
          <FolderItems folder={tree} current={file?.path} />
        </nav>
        <div className="min-w-0">{file ? <FileView key={file.path} file={file} /> : <Landing />}</div>
      </main>

      <PageFooter left="WQ Learn Book · Practical Book" right={file?.name ?? "wq_practical_book"} />
    </>
  );
}
