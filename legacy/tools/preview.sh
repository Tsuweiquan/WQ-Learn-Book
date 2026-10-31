#!/usr/bin/env bash
# Serve the Learn Book locally. Each page gets the document wrapper the publisher
# would add, mermaid comes from a CDN in place of the publish-time runtime, and
# claude.ai artifact links are pointed at the local copies.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${1:-8000}"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

link_rewrites=()
while IFS=$'\t' read -r path url _; do
  link_rewrites+=(-e "s#${url}#$(basename "$path")#g")
done < <(tail -n +2 artifacts.tsv)

while IFS=$'\t' read -r path _ _; do
  {
    echo '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
    sed "${link_rewrites[@]}" "$path"
    echo '<script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>'
    echo '<script>mermaid.initialize({startOnLoad:true});</script>'
    echo '</body></html>'
  } > "$OUT/$(basename "$path")"
done < <(tail -n +2 artifacts.tsv)

echo "WQ Learn Book preview: http://localhost:${PORT}/"
python3 -m http.server "$PORT" --bind 127.0.0.1 -d "$OUT"
