declare module "virtual:practical-files" {
  const files: { path: string; lang: string; html: string | null }[];
  export default files;
}

declare module "*.md" {
  import type { MDXProps } from "mdx/types";

  export default function MDXContent(props: MDXProps): React.JSX.Element;
}

declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";

  // Typed as TopicFrontmatter in src/lib/topics.ts.
  export const frontmatter: unknown;
  export default function MDXContent(props: MDXProps): React.JSX.Element;
}
