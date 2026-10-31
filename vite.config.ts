import mdx from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

import { remarkMermaid } from "./plugins/remark-mermaid";
import { shikiCodeTitle } from "./plugins/shiki-code-title";

export default defineConfig({
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [
          remarkGfm,
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: "frontmatter" }],
          remarkMermaid,
        ],
        rehypePlugins: [
          [
            rehypeShiki,
            {
              themes: { light: "github-light", dark: "github-dark" },
              defaultColor: false,
              fallbackLanguage: "text",
              transformers: [shikiCodeTitle()],
            },
          ],
        ],
      }),
    },
    react({ include: /\.(mdx|ts|tsx)$/ }),
    tailwindcss(),
  ],
});
