import { Inbox } from "lucide-react";
import { cn } from "@/lib/shared";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Nothing here yet",
  description = "No data available at the moment.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700/50 bg-zinc-900/30 p-12 text-center", className)}>
      {icon || (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800/50 ring-1 ring-zinc-700/30">
          <Inbox size={28} className="text-zinc-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-300">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-zinc-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
