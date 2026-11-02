import type { MDXProps } from "mdx/types";
import type { ComponentType } from "react";
import files from "virtual:practical-files";

export interface PracticalFile {
  /** Path inside wq_practical_book/, e.g. "docker/notification-service/Dockerfile". */
  path: string;
  name: string;
  lang: string;
  /** Highlighted source. Null for Markdown, which has `Doc` instead. */
  html: string | null;
  Doc?: ComponentType<MDXProps>;
}

export interface TreeFolder {
  name: string;
  folders: TreeFolder[];
  files: PracticalFile[];
}

const FOLDER_PREFIX = "../../wq_practical_book/";

const docs = import.meta.glob<{ default: ComponentType<MDXProps> }>(
  ["../../wq_practical_book/**/*.md", "!**/target/**"],
  { eager: true },
);

export const practicalFiles: PracticalFile[] = files.map((file) => ({
  ...file,
  name: file.path.slice(file.path.lastIndexOf("/") + 1),
  Doc: docs[`${FOLDER_PREFIX}${file.path}`]?.default,
}));

/** The Markdown guides, shortest path first, for the landing page. */
export const practicalGuides = practicalFiles
  .filter((file) => file.Doc)
  .sort((a, b) => a.path.split("/").length - b.path.split("/").length || a.path.localeCompare(b.path));

export function findPracticalFile(path: string): PracticalFile | undefined {
  return practicalFiles.find((file) => file.path === path);
}

export function practicalPath(path: string): string {
  return `/practical/${path}`;
}

export function githubUrl(path: string): string {
  return `https://github.com/Tsuweiquan/WQ-Learn-Book/blob/main/wq_practical_book/${path}`;
}

/** Sorted file tree. A folder holding only one folder is merged with it: `src/main/java`. */
export function buildTree(): TreeFolder {
  const root: TreeFolder = { name: "", folders: [], files: [] };
  for (const file of practicalFiles) {
    let folder = root;
    for (const name of file.path.split("/").slice(0, -1)) {
      let next = folder.folders.find((f) => f.name === name);
      if (!next) {
        next = { name, folders: [], files: [] };
        folder.folders.push(next);
      }
      folder = next;
    }
    folder.files.push(file);
  }
  const tidy = (folder: TreeFolder): TreeFolder => {
    folder.folders = folder.folders.map(tidy).sort((a, b) => a.name.localeCompare(b.name));
    folder.files.sort((a, b) => a.name.localeCompare(b.name));
    const [only] = folder.folders;
    if (folder.name && only && folder.folders.length === 1 && folder.files.length === 0) {
      return { ...only, name: `${folder.name}/${only.name}` };
    }
    return folder;
  };
  return tidy(root);
}

/** Turns a link inside a Markdown file into a site link. External and #hash links pass through. */
export function resolvePracticalLink(fromPath: string, href: string): string {
  if (/^[a-z]+:/i.test(href) || href.startsWith("#")) return href;
  const [target = "", hash] = href.split("#");
  const parts = fromPath.split("/").slice(0, -1);
  for (const segment of target.split("/")) {
    if (segment === "..") parts.pop();
    else if (segment !== ".") parts.push(segment);
  }
  return `${practicalPath(parts.join("/"))}${hash ? `#${hash}` : ""}`;
}
