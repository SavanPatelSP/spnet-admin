"use client";

import { cn, formatDateTime, daysUntil } from "@/lib/shared";
import { Circle, CircleCheck, CircleDot, CircleOff, Timer } from "lucide-react";

interface LifecycleStage {
  label: string;
  timestamp: string | Date | null;
  reached: boolean;
}

interface LifecycleVisualizationProps {
  createdAt: string | Date;
  activatedAt?: string | Date | null;
  expiresAt: string | Date;
  status: string;
  className?: string;
}

export function LifecycleVisualization({ createdAt, activatedAt, expiresAt, status, className }: LifecycleVisualizationProps) {
  const daysLeft = daysUntil(expiresAt);
  const isExpired = status === "EXPIRED" || daysLeft < 0;

  const stages: LifecycleStage[] = [
    { label: "Created", timestamp: createdAt, reached: true },
    { label: "Activated", timestamp: activatedAt || null, reached: !!activatedAt },
    { label: "In Use", timestamp: activatedAt || null, reached: status === "ACTIVE" && !isExpired },
    { label: "Expiring", timestamp: expiresAt, reached: daysLeft >= 0 && daysLeft <= 30 && !isExpired },
    { label: "Expired", timestamp: isExpired ? expiresAt : null, reached: isExpired },
  ];

  const currentIndex = stages.findLastIndex((s) => s.reached);

  return (
    <div className={cn("rounded-3xl border border-zinc-800 bg-zinc-900 p-6", className)}>
      <div className="mb-5 flex items-center gap-2">
        <Timer size={18} className="text-zinc-400" />
        <h2 className="text-lg font-semibold">License Lifecycle</h2>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 h-full w-0.5 bg-zinc-800" />
        <div className="space-y-6">
          {stages.map((stage, i) => {
            const isCurrent = i === currentIndex;
            const isPast = i < currentIndex;
            const isFuture = i > currentIndex;

            return (
              <div key={stage.label} className="relative flex items-start gap-4 pl-0">
                <div className="relative z-10 flex shrink-0 items-center justify-center">
                  {isCurrent ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 ring-4 ring-blue-500/10">
                      <CircleDot size={16} className="text-blue-400" />
                    </div>
                  ) : isPast ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                      <CircleCheck size={16} className="text-green-400" />
                    </div>
                  ) : isExpired && stage.label === "Expired" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
                      <CircleOff size={16} className="text-red-400" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                      <Circle size={16} className="text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isCurrent && "text-blue-400",
                        isPast && "text-green-400",
                        isFuture && !(isExpired && stage.label === "Expired") && "text-zinc-600",
                        isExpired && stage.label === "Expired" && "text-red-400",
                      )}
                    >
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-medium text-blue-400">
                        Current
                      </span>
                    )}
                  </div>
                  {stage.timestamp && (
                    <p className={cn("mt-0.5 text-xs", isFuture ? "text-zinc-700" : "text-zinc-500")}>
                      {formatDateTime(stage.timestamp)}
                    </p>
                  )}
                  {!stage.timestamp && !isFuture && (
                    <p className="mt-0.5 text-xs text-zinc-600">Not yet recorded</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
