# WQ Learn Book

The user's personal technical notebook: one page per topic, learned top-down (architecture → theory → implementation), grouped by area. It is a React app built with HeroUI. Pages are MDX files.

## How this file is written

Rules are requirements in EARS form (Easy Approach to Requirements Syntax). "Claude" is the agent working in this repo. "The site" is the built app. "shall" is mandatory, "shall not" is forbidden.

| Pattern | Form | Applies |
| --- | --- | --- |
| Ubiquitous | Claude shall … | Always |
| Event-driven | When <trigger>, Claude shall … | When the trigger happens |
| State-driven | While <state>, Claude shall … | For as long as the state holds |
| Unwanted behaviour | If <condition>, then Claude shall … | On an error or exception |
| Optional feature | Where <feature>, Claude shall … | Only where the feature exists |

Blocks marked **Reference** are facts (paths, versions, components), not requirements.

## Commands

**Reference**

- `npm run dev`: dev server at http://localhost:5173
- `npm run build`: type-check (`tsc --noEmit`), then a production build into `dist/`
- `npm run preview`: serve the built `dist/`

## Deploy

**Reference.** The site is https://tsuweiquan.github.io/WQ-Learn-Book/ (repo `Tsuweiquan/WQ-Learn-Book`), deployed by `.github/workflows/deploy.yml`. The site is served under `/<repo>/`: the workflow passes it as `vite build --base`, and `src/main.tsx` hands `import.meta.env.BASE_URL` to the router as `basename`.

- When a commit is pushed to `main`, the deploy workflow shall build the site and deploy it to GitHub Pages, in about two minutes.
- The repo's Pages source shall be set to "GitHub Actions" (Settings → Pages).
- Claude shall not hard-code `/` in asset URLs or `<a href>`.
- When Claude links to a page or an asset, Claude shall use router links, HeroUI links (`RouterProvider` adds the base) or `import.meta.env.BASE_URL`.
- When GitHub Pages receives a deep link such as `/<repo>/observability/otel-java-kind`, the site shall load the app from `404.html` (the workflow copies `index.html` to it, because Pages has no SPA routing) and render the right page, with HTTP status 404.
- When Claude tests a Pages build locally, Claude shall run `npm run build -- --base /<repo>/` and serve `dist/` under that prefix.

## Stack

**Reference.** Vite 8, React 19, TypeScript 7, Tailwind CSS v4, HeroUI v3, React Router 8 (declarative `<Routes>`), MDX 3 with Shiki (build-time highlighting) and Mermaid (rendered in the browser).

**Reference.** HeroUI v3 is not v2/NextUI:
- There is no provider.
- Components are compound (`Card.Header`, `Alert.Title`).
- Styles come from `@import "@heroui/styles"`.
- Dark mode is the `.dark` class / `data-theme` attribute, driven by HeroUI's `useTheme`.

- Claude shall not use HeroUI v2/NextUI APIs.
- When Claude uses a HeroUI component, Claude shall check the v3 docs instead of relying on memory: https://heroui.com/react/llms.txt, or a component page as raw text such as https://heroui.com/en/docs/react/components/card.mdx.

## Layout

**Reference**

- `content/<area>/<slug>.mdx` is a topic. The path is the URL (`/observability/otel-java-kind`, `/observability/otel-java-kind/traces-tempo`), and it also sets the page's area and parent.
- `src/lib/areas.ts` lists the areas (folder slug, title, one-line blurb) in display order.
- `src/lib/redirects.ts` maps old URLs to new ones: the pre-restructure `/topics/NN-slug` pages and the renamed `wq_practical_book/Lab` folders.
- `src/components/mdx/` holds the components available inside MDX (mapped in `index.tsx`).
- `src/pages/`:
  - `HomePage.tsx`: learning method (three compact cards), topic index grouped by area, practical book, good reads, page types, house rules, and the CNCF Landscape grid embedded in an iframe (landscape.cncf.io allows framing; there is also a link out).
  - `TopicPage.tsx`: area sidebar (a drawer on a phone), breadcrumbs, the "In this topic" list of child pages, auto-built table of contents, content.
  - `TagsPage.tsx`: `/tags` and `/tags/<tag>`. Tags that differ only in case or punctuation are merged (`kind`, `KinD`).
- `src/components/`: `SiteHeader` (search, opened with Ctrl/⌘ K or `/`), `TopicNav` (the sidebar tree), `SearchDialog` (searches titles, summaries, tags, area and type, see `src/lib/search.ts`), `TopicRow`.
- `src/lib/topics.ts`: the page registry (areas, parents, tags) and the frontmatter type.
- `src/styles.css`: the Learn Book palette (it overrides HeroUI's variables for light and dark) and the prose styles.
- `plugins/`: the remark plugin that turns ```` ```mermaid ```` fences into `<Mermaid>`, and the Shiki transformer for code-block titles.
- `wq_practical_book/`: the user's hands-on setups (app code, Dockerfiles, Helm).
- `legacy/`: the old claude.ai artifact HTML, kept for reference only.

**Pages**

- Where a topic has labs or deep dives, Claude shall put them in a folder named after the topic: `content/<area>/<slug>/<child>.mdx`.
- Claude shall not number pages.
- When a page file is added under `content/`, the site shall list it in the home page's index, the sidebar, search and the tag pages, with no other change.
- Within an area, the site shall order pages by `added`.

**Areas and redirects**

- When Claude adds an area folder, Claude shall add its entry (folder slug, title, one-line blurb) to `src/lib/areas.ts`, in display order.
- Claude shall not name an area `topics`, `practical` or `tags`, because those are routes.
- When Claude moves or renames a page or a lab folder, Claude shall add its old path to `src/lib/redirects.ts`.
- Claude shall not remove entries from `src/lib/redirects.ts`.

**Practical book**

- Where lab notes are added, they shall go in `wq_practical_book/Lab/<topic-slug>/NN-<part>/` (for example `Lab/otel-java-kind/02-logs/`), numbered in the order the user does them.
- When the site is built, `plugins/practical-book.ts` shall publish every text file in `wq_practical_book/` at `/practical/<path>`, except `target/`, `mvnw` and `mvnw.cmd`. Markdown shall render as a page, and links between READMEs shall work.
- If a file in `wq_practical_book/` contains a secret (a token, password or credential), then Claude shall not commit it and shall tell the user, because everything in that folder is public once pushed.

**Legacy**

- Claude shall not update `legacy/`. Those artifacts are no longer updated.

## Writing a page

**Reference.** Frontmatter (see `TopicFrontmatter` in `src/lib/topics.ts`):

```yaml
---
title: Full page title
shortTitle: Short title for the sidebar, tabs, breadcrumbs, footer
summary: Lede under the page title.
indexSummary: One line for the topic index and search results
added: "2026-10-28"          # quoted; orders pages within an area
tags: [Kubernetes, GKE]      # real tags only: tools, platforms, concepts. Each gets a /tags page. No versions or durations.
type: lab                    # child pages only: "lab" or "deep-dive" (a child defaults to deep-dive, a top-level page is a topic)
duration: "~45 min"          # labs, optional
progress: partial            # optional: the user's own run of the lab, "partial" or "complete"; shown as a badge
---
```

**Frontmatter**

- Claude shall not set area or parent in frontmatter. They come from the file's path.
- Claude shall quote dates in frontmatter.
- Claude shall use only real tags (tools, platforms, concepts), with no versions or durations.
- Where a page is a child page, Claude shall set `type` to `lab` or `deep-dive`.
- Where the user has run the lab, Claude shall set `progress` to `partial` or `complete` to match.

**Page types** (documented on the home page under "Page types")

- Where a page is a topic (`content/<area>/<slug>.mdx`), Claude shall write the full topic template below.
- Where a page is a lab (`content/<area>/<topic>/<slug>.mdx`, `type: lab`), a hands-on run of the parent topic, Claude shall write:
  - Part 1 "Lab architecture": the host, a diagram per lab;
  - Part 2 "What the tests prove": goals, how they're measured, pass criteria;
  - Part 3 "Run the lab": setup, steps, what "working" looks like, cleanup, References;
  - an optional Part 4.
- Where a page is a deep dive (`content/<area>/<topic>/<slug>.mdx`, `type: deep-dive`), one part of the parent topic in depth, Claude shall start it with a `<Muted>` "Builds on …" note naming the parent sections and labs it assumes, then write the full template scoped to that part.
- When Claude refers to another page, Claude shall refer to it by name ("see [OTel Java on KinD](/observability/otel-java-kind)"), not by number.

**Topic template and house rules**

- Claude shall write `<Part level={1} id="arch" title="Architecture examples" toc="Architecture">` with several architectures, each with a diagram, then a comparison of when to choose which.
- Claude shall write `<Part level={2} id="theory" title="Theory">` covering what it is, why the industry does it this way, the problems it solves, pros and cons.
- Claude shall write `<Part level={3} id="impl" title="Implementation">` with runnable code and config, a way to test it on a laptop (kind, docker compose, emulators), expected output and cleanup.
- Claude shall end Part 3 with `<Block id="refs" title="References">`, linking the official docs and sources used.
- Where the user has their own lab notes for the topic, Claude shall add `<Part level={4} id="self" title="Self implementation">` after Part 3, linking them (`/practical/Lab/<topic-slug>/NN-<part>/README-….md`) with what is done, how the user's setup differs and the problems hit, and shall set `progress` to match.
- Claude shall source content, not guess it.
- If Claude cannot verify a statement, then Claude shall mark it with `<Note title="Unsure">`.
- Claude shall write each subsection inside a Part as `<Block id="arch-a" title="1.2 Architecture A · …" toc="1.2 A · …">`.

**Reference.** The table of contents is built from Parts and Blocks. `toc` is an optional shorter label.

**Reference.** Components:

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

**Reference.** Markdown features:
- GFM tables render with HeroUI table styles.
- ```` ```yaml title="k8s/app.yaml" ```` adds a file label above a code block.
- ```` ```text output ```` renders an "Example output" block.
- ```` ```mermaid ```` renders a diagram.
- Other pages are linked by path (`/observability/otel-java-kind`, `/observability/otel-java-kind/traces-tempo`), and sections as `#block-id`.

**MDX pitfalls**

- If prose contains `{`, `}` or `<`, then Claude shall put them in code spans or escape them, because MDX parses them as JSX.
- Claude shall put a component's children on their own lines, not on the tag's line, because otherwise MDX treats the component as inline and wraps it in a `<p>`.

## Adding a topic on request

**Reference.** The user often asks for a new topic from the Claude mobile app ("make a topic on Kafka consumer groups"). That runs as a Claude Code cloud session on a fresh clone of this repo.

When the user asks for a new topic, lab or deep dive, Claude shall carry the job through until the page is live and the user has the link, in this order:

1. If `node_modules/` is missing, then Claude shall run `npm ci`.
2. Claude shall place the page:
   - Claude shall put a topic in the `content/` area folder that fits (see `src/lib/areas.ts`), with a short slug: `content/<area>/<short-slug>.mdx`.
   - If no area fits, then Claude shall add one to `src/lib/areas.ts`.
   - Where the page is a lab or deep dive under an existing topic, Claude shall put it in that topic's folder, `content/<area>/<topic>/<short-slug>.mdx`, with `type` set.
   - Claude shall set `added` to today.
3. Before writing, Claude shall read the official docs and primary sources and link them in References.
   - If Claude cannot verify a statement, then Claude shall mark it with `<Note title="Unsure">`.
   - If a fetch is blocked by the session's network, then Claude shall say so in the page and in the reply, and shall not fill the gap from memory.
4. Claude shall write the full template (Parts 1–3), with an Implementation part that runs on a laptop and has expected output and cleanup.
5. Claude shall run `npm run build`.
   - If the build fails, then Claude shall fix the cause and rebuild before committing. MDX syntax errors show up there.
   - Claude shall keep diagrams to the flowchart and sequence syntax the existing topics use, because the build doesn't catch Mermaid errors (diagrams render in the browser).
6. When the build passes, Claude shall commit as `Add topic: <shortTitle>` (or `Add lab: …` / `Add deep dive: …`) and push to `main`, because only `main` deploys.
   - While the session works on a `claude/…` branch, Claude shall fast-forward merge it into `main` and push `main` too, unless the user asked for a PR.
7. When the push succeeds, Claude shall reply with a short summary and the live link `https://tsuweiquan.github.io/WQ-Learn-Book/<area>/<slug>` (with `/<child>` for a lab or deep dive), and say it is live about two minutes after the push.

When Claude edits an existing topic, Claude shall follow the same build → commit → push to `main` loop.

## Verifying changes

- When Claude changes the repo, Claude shall run `npm run build`.
- When Claude changes the UI, Claude shall also open the dev server and check light and dark themes, a phone-width viewport (including the topic drawer), and that the Mermaid diagrams render.
