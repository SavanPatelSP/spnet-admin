"use client";

import { AlertTriangle, AlertCircle, Info, Circle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/shared";

interface SeverityIndicatorProps {
  severity: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const severityConfig: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
  Critical: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", label: "Critical" },
  High: { icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-500/10", label: "High" },
  Medium: { icon: Info, color: "text-yellow-400", bg: "bg-yellow-500/10", label: "Medium" },
  Low: { icon: Circle, color: "text-zinc-400", bg: "bg-zinc-500/10", label: "Low" },
};

export function SeverityIndicator({ severity, showLabel = true, size = "sm" }: SeverityIndicatorProps) {
  const config = severityConfig[severity] || severityConfig.Medium;
  const Icon = config.icon;

  const sizeClasses = size === "sm" ? "h-5 w-5" : size === "md" ? "h-6 w-6" : "h-7 w-7";
  const iconSize = size === "sm" ? 12 : size === "md" ? 14 : 16;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", config.bg, config.color)}>
      <Icon size={iconSize} className={cn(sizeClasses.replace(/h-\d+ w-\d+/g, "").trim() || "", "shrink-0")} />
      {showLabel && config.label}
    </span>
  );
}
