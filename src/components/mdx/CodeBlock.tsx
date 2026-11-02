import { Check, Copy } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useRef, useState, type ComponentProps } from "react";

type PreProps = ComponentProps<"pre"> & {
  "data-title"?: string;
  "data-lang"?: string;
  "data-output"?: string;
};

/** Renders Shiki's <pre>: a header with the file name (or language) and a copy button. */
export function CodeBlock({
  "data-title": title,
  "data-lang": lang,
  "data-output": output,
  className,
  style: _shikiStyle,
  children,
  ...rest
}: PreProps) {
  const pre = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(pre.current?.innerText ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (output) {
    return (
      <figure className="grid min-w-0 gap-1 rounded-xl border border-dashed border-border bg-surface px-4 pt-2 pb-3.5">
        <figcaption className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">Example output</figcaption>
        <pre ref={pre} className={`${className ?? ""} overflow-x-auto font-mono text-[13px] leading-[1.55]`} {...rest}>
          {children}
        </pre>
      </figure>
    );
  }

  const label = title ?? (lang && lang !== "text" ? lang : undefined);

  return (
    <figure className="grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-code">
      <figcaption className="flex min-h-9 items-center justify-between gap-2 border-b border-border py-1 ps-4 pe-1.5">
        <span className="truncate font-mono text-xs text-muted">{label}</span>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={copied ? "Copied" : "Copy code"}
          onPress={copy}
          className="text-muted"
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </figcaption>
      <pre
        ref={pre}
        className={`${className ?? ""} overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-[1.55] text-code-ink`}
        {...rest}
      >
        {children}
      </pre>
    </figure>
  );
}
