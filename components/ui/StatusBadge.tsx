import { cn } from "@/lib/shared";

type StatusType = "ACTIVE" | "SUSPENDED" | "PENDING" | "EXPIRED" | "REVOKED" | "HEALTHY" | "WARNING" | "CRITICAL" | "ENABLED" | "DISABLED" | string;

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  SUSPENDED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  PENDING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  EXPIRED: "bg-red-500/10 text-red-400 border-red-500/20",
  REVOKED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  HEALTHY: "bg-green-500/10 text-green-400 border-green-500/20",
  WARNING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
  ENABLED: "bg-green-500/10 text-green-400 border-green-500/20",
  DISABLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status.toUpperCase()] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  return (
    <span className={cn("inline-block rounded-full border px-3 py-1 text-xs font-medium", style, className)}>
      {status}
    </span>
  );
}
