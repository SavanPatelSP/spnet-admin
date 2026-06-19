"use client";

import { cn } from "@/lib/shared";
import { WORKFLOW_LABELS } from "@/lib/content";
import type { WorkflowState } from "@/lib/content";

const styles: Record<WorkflowState, string> = {
  DRAFT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  IN_REVIEW: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  PUBLISHED: "bg-green-500/10 text-green-400 border-green-500/20",
  ARCHIVED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function WorkflowBadge({ status, className }: { status: WorkflowState; className?: string }) {
  return (
    <span className={cn("inline-block rounded-full border px-3 py-1 text-xs font-medium", styles[status], className)}>
      {WORKFLOW_LABELS[status]}
    </span>
  );
}
