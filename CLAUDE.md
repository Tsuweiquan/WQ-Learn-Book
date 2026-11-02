# WQ Learn Book

The user's personal technical notebook: one page per topic, learned top-down (architecture → theory → implementation). It is a React app built with HeroUI. Topic pages are MDX files.

## Commands

- `npm run dev`: dev server at http://localhost:5173
- `npm run build`: type-check (`tsc --noEmit`), then a production build into `dist/`
- `npm run preview`: serve the built `dist/`

## Deploy

The site is https://tsuweiquan.github.io/WQ-Learn-Book/ (repo `Tsuweiquan/WQ-Learn-Book`). `.github/workflows/deploy.yml` deploys it to GitHub Pages on every push to `main`, which takes about two minutes. The repo's Pages source must be set to "GitHub Actions" (Settings → Pages).

- The site is served under `/<repo>/`. The workflow passes it as `vite build --base`, and `src/main.tsx` hands `import.meta.env.BASE_URL` to the router as `basename`. Never hard-code `/` in asset URLs or `<a href>`. Use router links, HeroUI links (`RouterProvider` adds the base) or `import.meta.env.BASE_URL`.
- Pages has no SPA routing. The workflow copies `index.html` to `404.html`, so a deep link like `/<repo>/topics/02-…` loads the app with HTTP status 404 and still renders the right page.
- To test a Pages build locally: `npm run build -- --base /<repo>/`, then serve `dist/` under that prefix.

## Stack

Vite 8, React 19, TypeScript 7, Tailwind CSS v4, HeroUI v3, React Router 8 (declarative `<Routes>`), MDX 3 with Shiki (build-time highlighting) and Mermaid (rendered in the browser).

HeroUI v3 is not v2/NextUI:
- There is no provider.
- Components are compound (`Card.Header`, `Alert.Title`).
- Styles come from `@import "@heroui/styles"`.
- Dark mode is the `.dark` class / `data-theme` attribute, driven by HeroUI's `useTheme`.

Check the v3 docs instead of relying on memory: https://heroui.com/react/llms.txt. Each component page is also available as raw text, for example https://heroui.com/en/docs/react/components/card.mdx.

## Layout

- `content/topics/NN-slug.mdx` holds one page per topic. The file name is the URL (`/topics/NN-slug`). Every file appears in the home page's topic index automatically, sorted by `number`.
- `src/components/mdx/` holds the components available inside MDX (mapped in `index.tsx`).
- `src/pages/`:
  - `HomePage.tsx`: learning method, topic index, page template, house rules.
  - `TopicPage.tsx`: header, auto-built table of contents, content.
- `src/lib/topics.ts`: the topic registry and the frontmatter type.
- `src/styles.css`: the Learn Book palette (it overrides HeroUI's variables for light and dark) and the prose styles.
- `plugins/`: the remark plugin that turns ```` ```mermaid ```` fences into `<Mermaid>`, and the Shiki transformer for code-block titles.
- `wq_practical_book/`: the user's hands-on setups (app code, Dockerfiles, Helm). `plugins/practical-book.ts` publishes every text file in it at `/practical/<path>` at build time, so a new file appears on its own. Markdown renders as a page and links between READMEs work. `target/`, `mvnw` and `mvnw.cmd` are left out. Everything in this folder is public once pushed.
- `legacy/`: the old claude.ai artifact HTML, kept for reference only. Those artifacts are no longer updated.

## Writing a topic page

Frontmatter (see `TopicFrontmatter` in `src/lib/topics.ts`):

```yaml
---
number: "03"                 # "02a" for a lab under topic 02
parent: 02-blue-green-one-cluster   # labs/subtopics only: the parent's slug
title: Full page title
shortTitle: Short title for tabs, breadcrumbs, footer
summary: Lede under the page title.
indexSummary: One line for the home page's topic index
area: CI/CD
added: "2026-10-28"          # quoted
tags: [Kubernetes, GKE]
---
```

Follow the template on the home page and its house rules:

- `<Part level={1} id="arch" title="Architecture examples" toc="Architecture">`: several architectures, each with a diagram, then a comparison of when to choose which.
- `<Part level={2} id="theory" title="Theory">`: what it is, why the industry does it this way, the problems it solves, pros and cons.
- `<Part level={3} id="impl" title="Implementation">`: runnable code and config, a way to test it on a laptop (kind, docker compose, emulators), expected output, cleanup.
- A last `<Block id="refs" title="References">` inside Part 3, linking the official docs and sources used.
- Content is sourced, not guessed. Mark anything unverified with `<Note title="Unsure">`.

Inside a Part, each subsection is `<Block id="arch-a" title="1.2 Architecture A · …" toc="1.2 A · …">`. The table of contents is built from Parts and Blocks. `toc` is an optional shorter label.

| Component | Use |
| --- | --- |
| `<Fit>` + `<Pros title="Fits when">` / `<Cons title="Watch out for">` | Two-column fit / pros-cons cards (titles default to Pros / Cons) |
| `<Grid>` + `<InfoCard title>` | Two-column grid of concept cards |
| `<Note title>` | Warning callout: caveats, "Unsure", "Check before use" |
| `<Tip title>` | Accent callout: pointers, "What \"working\" looks like" |
| `<Steps>` + `<Step title>` | Numbered walkthrough |
| `<Checklist>` | Wraps a Markdown list of pass criteria |
| `<Muted>` | Secondary paragraph |
| `<Pill color="blue\|green">` | Inline colour label |

Markdown features:
- GFM tables render with HeroUI table styles.
- ```` ```yaml title="k8s/app.yaml" ```` adds a file label above a code block.
- ```` ```text output ```` renders an "Example output" block.
- ```` ```mermaid ```` renders a diagram.
- Link other pages as `/topics/<slug>` and sections as `#block-id`.

MDX pitfalls:
- `{`, `}` and `<` in prose are JSX. Put them in code spans or escape them.
- Put a component's children on their own lines, not on the tag's line. Otherwise MDX treats the component as inline and wraps it in a `<p>`.
- Quote dates in frontmatter.

## Adding a topic on request

The user often asks for a new topic from the Claude mobile app ("make a topic on Kafka consumer groups"). That runs as a Claude Code cloud session on a fresh clone of this repo. The job is done when the page is live and the user has the link:

1. If `node_modules/` is missing, run `npm ci`.
2. Pick the number: the highest top-level `number` + 1, two digits. A lab or deep dive under an existing topic gets a letter suffix (`02b`) and `parent`. Name the file `content/topics/NN-short-slug.mdx`, with `added` set to today.
3. Research before writing. Read the official docs and primary sources, link them in References, and mark anything you couldn't verify with `<Note title="Unsure">`. If a fetch is blocked by the session's network, say so in the page and in your reply instead of filling the gap from memory.
4. Write the full template (Parts 1–3). Make the Implementation part runnable on a laptop, with expected output and cleanup.
5. Run `npm run build`. It must pass. MDX syntax errors show up there. Mermaid errors don't (diagrams render in the browser), so keep diagrams to the flowchart and sequence syntax the existing topics use.
6. Commit as `Add topic NN: <shortTitle>` and push to `main`. If the session works on a `claude/…` branch, merge it into `main` (fast-forward) and push `main` too, unless the user asked for a PR. Only `main` deploys.
7. Reply with a short summary and the live link: `https://tsuweiquan.github.io/WQ-Learn-Book/topics/<slug>`. It is live about two minutes after the push.

Edits to an existing topic follow the same build → commit → push to `main` loop.

## Verifying changes

Run `npm run build`. For UI changes, also open the dev server and check light and dark themes, a phone-width viewport, and that the Mermaid diagrams render.
