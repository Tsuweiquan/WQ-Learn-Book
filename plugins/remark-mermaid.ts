import type { Code, Root } from "mdast";
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";
import { visit } from "unist-util-visit";

// Turns ```mermaid fences into <Mermaid chart="..." /> before Shiki sees them,
// so diagrams are written as plain fenced blocks in MDX.
export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (node.lang !== "mermaid" || !parent || index === undefined) return;
      const element: MdxJsxFlowElement = {
        type: "mdxJsxFlowElement",
        name: "Mermaid",
        attributes: [{ type: "mdxJsxAttribute", name: "chart", value: node.value }],
        children: [],
      };
      parent.children.splice(index, 1, element);
    });
  };
}
