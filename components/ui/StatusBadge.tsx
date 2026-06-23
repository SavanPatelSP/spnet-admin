import { cn } from "@/lib/shared";

type StatusType = "ACTIVE" | "SUSPENDED" | "PENDING" | "EXPIRED" | "REVOKED" | "HEALTHY" | "WARNING" | "CRITICAL" | "ENABLED" | "DISABLED" | string;

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 ring-1 ring-green-500/20",
  SUSPENDED: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20",
  PENDING: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  EXPIRED: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
  REVOKED: "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20",
  HEALTHY: "bg-green-500/10 text-green-400 ring-1 ring-green-500/20",
  WARNING: "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20",
  CRITICAL: "bg-red-500/10 text-red-400 ring-1 ring-red-500/20",
  ENABLED: "bg-green-500/10 text-green-400 ring-1 ring-green-500/20",
  DISABLED: "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20",
};

const statusDotStyles: Record<string, string> = {
  ACTIVE: "bg-green-400",
  SUSPENDED: "bg-yellow-400",
  PENDING: "bg-blue-400",
  EXPIRED: "bg-red-400",
  REVOKED: "bg-zinc-400",
  HEALTHY: "bg-green-400",
  WARNING: "bg-yellow-400",
  CRITICAL: "bg-red-400",
  ENABLED: "bg-green-400",
  DISABLED: "bg-zinc-400",
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, className, dot }: StatusBadgeProps) {
  const style = statusStyles[status.toUpperCase()] || "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20";
  const dotStyle = statusDotStyles[status.toUpperCase()] || "bg-zinc-400";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", style, className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotStyle)} />}
      {status}
    </span>
  );
}
