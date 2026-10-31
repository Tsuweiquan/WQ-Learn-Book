declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";

  // Typed as TopicFrontmatter in src/lib/topics.ts.
  export const frontmatter: unknown;
  export default function MDXContent(props: MDXProps): React.JSX.Element;
}
