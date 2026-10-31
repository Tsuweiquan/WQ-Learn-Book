import { Link } from "@heroui/react";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";

import { CodeBlock } from "./CodeBlock";
import {
  Block,
  Checklist,
  Cons,
  Fit,
  Grid,
  InfoCard,
  Muted,
  Note,
  Part,
  Pill,
  Pros,
  Step,
  Steps,
  Tip,
} from "./layout";
import { Mermaid } from "./Mermaid";
import { Table, Tbody, Td, Th, Thead, Tr } from "./table";

function MdxLink({ href = "", children }: ComponentProps<"a">) {
  const external = /^https?:\/\//.test(href);
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="text-accent"
    >
      {children}
    </Link>
  );
}

export const mdxComponents: MDXComponents = {
  a: MdxLink,
  pre: CodeBlock,
  table: Table,
  thead: Thead,
  tbody: Tbody,
  tr: Tr,
  th: Th,
  td: Td,
  Part,
  Block,
  Muted,
  Fit,
  Grid,
  Pros,
  Cons,
  InfoCard,
  Note,
  Tip,
  Steps,
  Step,
  Checklist,
  Pill,
  Mermaid,
};
