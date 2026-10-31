import { Spinner } from "@heroui/react";
import { useEffect, useId, useState } from "react";

import { useAppTheme } from "../../lib/theme";

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Renders a Mermaid diagram in the page's palette. Written in MDX as a ```mermaid fence. */
export function Mermaid({ chart }: { chart: string }) {
  const { resolvedTheme } = useAppTheme();
  const id = `mmd-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!resolvedTheme) return;
    let cancelled = false;
    (async () => {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: cssVar("--font-sans"),
        darkMode: resolvedTheme === "dark",
        // The default (200px) splits short labels such as "Deployment my-app-blue".
        flowchart: { wrappingWidth: 280 },
        themeVariables: {
          background: cssVar("--surface"),
          primaryColor: cssVar("--code-bg"),
          primaryTextColor: cssVar("--foreground"),
          primaryBorderColor: cssVar("--accent"),
          secondaryColor: cssVar("--sky"),
          tertiaryColor: cssVar("--background"),
          lineColor: cssVar("--muted"),
          textColor: cssVar("--foreground"),
          edgeLabelBackground: cssVar("--surface"),
          clusterBkg: cssVar("--background"),
          clusterBorder: cssVar("--border"),
        },
      });
      try {
        const result = await mermaid.render(`${id}-${resolvedTheme}`, chart);
        if (!cancelled) {
          setSvg(result.svg);
          setError(undefined);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id, resolvedTheme]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-xl border border-danger p-4 font-mono text-xs text-danger">
        Mermaid error: {error}
        {"\n\n"}
        {chart}
      </pre>
    );
  }

  return (
    <figure className="grid min-h-40 place-items-center overflow-x-auto rounded-xl border border-border bg-surface p-4 [&_svg]:h-auto [&_svg]:max-w-full">
      {svg ? <div className="contents" dangerouslySetInnerHTML={{ __html: svg }} /> : <Spinner size="sm" />}
    </figure>
  );
}
