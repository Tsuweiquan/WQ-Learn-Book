import { Chip } from "@heroui/react";

import type { TopicProgress } from "../lib/topics";

const PROGRESS: Record<TopicProgress, { label: string; color: "warning" | "success" }> = {
  partial: { label: "Partially completed", color: "warning" },
  complete: { label: "Complete", color: "success" },
};

/** Badge for how far the user's own run of a topic's lab got (frontmatter `progress`). */
export function ProgressChip({ progress, className = "" }: { progress: TopicProgress; className?: string }) {
  const { label, color } = PROGRESS[progress];
  return (
    <Chip size="sm" variant="soft" color={color} className={`font-mono ${className}`}>
      {label}
    </Chip>
  );
}
