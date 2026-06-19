"use client";

import { useMemo } from "react";
import { cn, daysUntil, formatDate } from "@/lib/shared";
import { EXPIRING_SOON_DAYS } from "@/lib/constants";
import { Clock, AlertTriangle, CheckCircle2, CalendarDays } from "lucide-react";

interface TimelineLicense {
  id: string;
  key: string;
  organization: string;
  plan: string;
  status: string;
  expiresAt: string | Date;
  usageCount: number;
  usageLimit: number;
}

interface ExpirationTimelineProps {
  licenses: TimelineLicense[];
  className?: string;
}

function healthDot(daysLeft: number, status: string): string {
  if (status === "EXPIRED" || daysLeft < 0) return "bg-red-400";
  if (daysLeft <= 7) return "bg-red-400";
  if (daysLeft <= EXPIRING_SOON_DAYS) return "bg-yellow-400";
  return "bg-green-400";
}

export function ExpirationTimeline({ licenses, className }: ExpirationTimelineProps) {
  const sections = useMemo(() => {
    const expired: TimelineLicense[] = [];
    const expiring: TimelineLicense[] = [];
    const active: TimelineLicense[] = [];

    for (const l of licenses) {
      const d = daysUntil(l.expiresAt);
      if (l.status === "EXPIRED" || d < 0) {
        expired.push(l);
      } else if (d <= EXPIRING_SOON_DAYS) {
        expiring.push(l);
      } else {
        active.push(l);
      }
    }

    return [
      { key: "expired", label: "Expired", icon: Clock, count: expired.length, items: expired, dot: "bg-red-400", line: "bg-red-500/30" },
      { key: "expiring", label: "Expiring Soon (30 days)", icon: AlertTriangle, count: expiring.length, items: expiring, dot: "bg-yellow-400", line: "bg-yellow-500/30" },
      { key: "active", label: "Active", icon: CheckCircle2, count: active.length, items: active, dot: "bg-green-400", line: "bg-green-500/30" },
    ];
  }, [licenses]);

  return (
    <div className={cn("rounded-3xl border border-zinc-800 bg-zinc-900 p-6", className)}>
      <div className="mb-5 flex items-center gap-2">
        <CalendarDays size={18} className="text-zinc-400" />
        <h2 className="text-lg font-semibold">Expiration Timeline</h2>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-6 lg:flex-row" style={{ minWidth: 600 }}>
          {sections.map((section) => (
            <div key={section.key} className="flex-1">
              <div className="mb-3 flex items-center gap-2">
                <section.icon size={14} className={cn(section.dot.replace("bg-", "text-"))} />
                <h3 className="text-sm font-semibold text-zinc-300">{section.label}</h3>
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium", section.dot.replace("bg-", "bg-") + "/10 " + section.dot.replace("bg-", "text-"))}>
                  {section.count}
                </span>
              </div>
              <div className="space-y-3">
                {section.items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center">
                    <p className="text-xs text-zinc-600">No licenses</p>
                  </div>
                )}
                {section.items.map((l) => {
                  const d = daysUntil(l.expiresAt);
                  return (
                    <div
                      key={l.id}
                      className={cn(
                        "rounded-xl border bg-zinc-800/30 p-3 transition-colors hover:bg-zinc-800/60",
                        section.key === "expired" ? "border-red-500/10" :
                        section.key === "expiring" ? "border-yellow-500/10" : "border-zinc-700/50",
                      )}
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-200">{l.organization}</span>
                        <span className={cn("inline-block h-2 w-2 rounded-full", healthDot(d, l.status))} />
                      </div>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">{l.plan}</span>
                        <span className="text-[10px] text-zinc-500">{l.usageCount}/{l.usageLimit} used</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={d < 0 ? "text-red-400" : d <= EXPIRING_SOON_DAYS ? "text-yellow-400" : "text-zinc-500"}>
                          {d < 0 ? "Expired" : `${d}d left`}
                        </span>
                        <span className="text-zinc-600">{formatDate(l.expiresAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-[10px] text-zinc-600">Scroll horizontally for more · Licenses grouped by expiration status</p>
    </div>
  );
}
