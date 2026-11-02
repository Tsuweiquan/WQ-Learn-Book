import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { bundledLanguages, codeToHtml } from "shiki";
import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:practical-files";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

// Build output and generated wrapper scripts: committed or not, they aren't the setup.
const SKIP = new Set(["target", "node_modules", ".git", "mvnw", "mvnw.cmd"]);

const LANG_BY_EXTENSION: Record<string, string> = { tpl: "yaml", yml: "yaml" };

function languageOf(fileName: string): string {
  if (fileName === "Dockerfile" || fileName.endsWith(".Dockerfile")) return "docker";
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const lang = LANG_BY_EXTENSION[extension] ?? extension;
  return lang in bundledLanguages ? lang : "text";
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/**
 * Exposes the files of wq_practical_book/ as `virtual:practical-files`: each text file's
 * path, with its source highlighted at build time. Markdown is left out of the highlighting
 * because src/lib/practical.ts imports it through the MDX pipeline and renders it as a page.
 */
export function practicalBook(folder: string): Plugin {
  const root = resolve(folder);
  return {
    name: "practical-book",
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    async load(id) {
      if (id !== RESOLVED_ID) return;
      const files = [];
      for (const absolute of walk(root)) {
        this.addWatchFile(absolute);
        const path = relative(root, absolute).split(sep).join("/");
        const buffer = readFileSync(absolute);
        if (buffer.includes(0)) continue; // binary
        const fileName = path.slice(path.lastIndexOf("/") + 1);
        files.push({
          path,
          html: path.endsWith(".md")
            ? null
            : await codeToHtml(buffer.toString("utf8"), {
                lang: languageOf(fileName),
                themes: { light: "github-light", dark: "github-dark" },
                defaultColor: false,
                structure: "inline",
              }),
          lang: languageOf(fileName),
        });
      }
      return `export default ${JSON.stringify(files)};`;
    },
  };
}
