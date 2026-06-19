"use client";

import { cn, daysUntil, formatDate } from "@/lib/shared";
import { EXPIRING_SOON_DAYS } from "@/lib/constants";
import { ShieldCheck, ShieldAlert, ShieldX, Clock, ArrowUpRight, Activity } from "lucide-react";

type HealthStatus = "healthy" | "warning" | "critical" | "expired";

interface LicenseHealthCardProps {
  id: string;
  key: string;
  organization: string;
  plan: string;
  status: string;
  usageCount: number;
  usageLimit: number;
  expiresAt: string | Date;
  onClick?: (id: string) => void;
  className?: string;
}

function computeHealth(status: string, usageCount: number, usageLimit: number, daysLeft: number): HealthStatus {
  if (status === "EXPIRED" || daysLeft < 0) return "expired";
  if (status !== "ACTIVE") return "critical";
  const usageRatio = usageLimit > 0 ? usageCount / usageLimit : 0;
  if (daysLeft <= 7 || usageRatio >= 0.9) return "critical";
  if (daysLeft <= EXPIRING_SOON_DAYS || usageRatio >= 0.75) return "warning";
  return "healthy";
}

function computeRisk(usageCount: number, usageLimit: number, daysLeft: number): "Low" | "Medium" | "High" {
  const usageRatio = usageLimit > 0 ? usageCount / usageLimit : 0;
  const usageRate = daysLeft > 0 ? usageCount / Math.max(daysLeft, 1) : 1;
  if (usageRatio >= 0.9 || daysLeft <= 7) return "High";
  if (usageRatio >= 0.75 || daysLeft <= EXPIRING_SOON_DAYS || usageRate > 0.5) return "Medium";
  return "Low";
}

const healthConfig: Record<HealthStatus, { icon: typeof ShieldCheck; label: string; bg: string; border: string; text: string; dot: string }> = {
  healthy: { icon: ShieldCheck, label: "Healthy", bg: "bg-green-500/5", border: "border-green-500/20", text: "text-green-400", dot: "bg-green-400" },
  warning: { icon: ShieldAlert, label: "Warning", bg: "bg-yellow-500/5", border: "border-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400" },
  critical: { icon: ShieldX, label: "Critical", bg: "bg-red-500/5", border: "border-red-500/20", text: "text-red-400", dot: "bg-red-400" },
  expired: { icon: Clock, label: "Expired", bg: "bg-zinc-500/5", border: "border-zinc-500/20", text: "text-zinc-400", dot: "bg-zinc-400" },
};

const riskStyles: Record<string, string> = {
  Low: "bg-green-500/10 text-green-400",
  Medium: "bg-yellow-500/10 text-yellow-400",
  High: "bg-red-500/10 text-red-400",
};

export function LicenseHealthCard({
  id,
  organization,
  plan,
  status,
  usageCount,
  usageLimit,
  expiresAt,
  onClick,
  className,
}: LicenseHealthCardProps) {
  const daysLeft = daysUntil(expiresAt);
  const health = computeHealth(status, usageCount, usageLimit, daysLeft);
  const risk = computeRisk(usageCount, usageLimit, daysLeft);
  const cfg = healthConfig[health];
  const Icon = cfg.icon;
  const usagePct = usageLimit > 0 ? Math.min(Math.round((usageCount / usageLimit) * 100), 100) : 0;
  const barColor = usagePct >= 90 ? "bg-red-500" : usagePct >= 75 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div
      onClick={() => onClick?.(id)}
      className={cn(
        "group relative cursor-pointer rounded-3xl border bg-zinc-900 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-800/50",
        cfg.border,
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", cfg.bg)}>
            <Icon size={20} className={cfg.text} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-100">{organization}</p>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                {plan}
              </span>
              <span className={cn("inline-block h-2 w-2 rounded-full", cfg.dot)} />
            </div>
          </div>
        </div>
        <ArrowUpRight size={16} className="mt-1 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mb-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">{usageCount}/{usageLimit} activations</span>
          <span className={cn("font-medium", usagePct >= 90 ? "text-red-400" : usagePct >= 75 ? "text-yellow-400" : "text-zinc-400")}>{usagePct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${usagePct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <Activity size={12} className="text-zinc-500" />
          <span className={cn("font-medium", daysLeft < 0 ? "text-red-400" : daysLeft <= EXPIRING_SOON_DAYS ? "text-yellow-400" : "text-zinc-400")}>
            {daysLeft < 0 ? "Expired" : `${daysLeft}d remaining`}
          </span>
          <span className="text-zinc-600">· {formatDate(expiresAt)}</span>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", riskStyles[risk])}>
          {risk} Risk
        </span>
      </div>
    </div>
  );
}
