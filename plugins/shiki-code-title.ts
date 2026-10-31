import type { ShikiTransformer } from "shiki";

// Carries fence meta onto the <pre> for the CodeBlock component:
//   ```yaml title="k8s/app.yaml"  → data-title, shown as a file label
//   ```text output                → data-output, styled as example output
export function shikiCodeTitle(): ShikiTransformer {
  return {
    name: "code-title",
    pre(node) {
      const meta = this.options.meta?.__raw ?? "";
      const title = meta.match(/title="([^"]+)"/)?.[1];
      if (title) node.properties.dataTitle = title;
      if (/(^|\s)output(\s|$)/.test(meta)) node.properties.dataOutput = "true";
      node.properties.dataLang = this.options.lang;
    },
  };
}
