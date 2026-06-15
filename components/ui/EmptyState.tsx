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
    <div className={cn("flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center", className)}>
      {icon || (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
          <Inbox size={32} className="text-zinc-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-zinc-300">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-zinc-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
