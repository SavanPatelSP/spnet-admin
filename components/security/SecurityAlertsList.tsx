"use client";

import { formatDateTime } from "@/lib/shared";

interface SecurityAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  createdAt: Date;
  resolved: boolean;
}

const severityColors: Record<string, string> = {
  LOW: "border-green-500/20 bg-green-500/10 text-green-400",
  MEDIUM: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  HIGH: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  CRITICAL: "border-red-500/20 bg-red-500/10 text-red-400",
};

const typeIcons: Record<string, string> = {
  LOGIN: "🔓",
  LOGOUT: "🔒",
  FAILED_LOGIN: "❌",
  LOCKED_ACCOUNT: "🔒",
  PERMISSION_CHANGE: "🛡️",
  ROLE_CHANGE: "👤",
  PREMIUM_GRANT: "⭐",
  PREMIUM_REVOKE: "💫",
  HIGH_RISK_SESSION: "⚠️",
  SESSION_HIJACK: "🚨",
  SUSPICIOUS_ACTIVITY: "🔍",
};

export default function SecurityAlertsList({ alerts }: { alerts: SecurityAlert[] }) {
  if (alerts.length === 0) {
    return <div className="py-4 text-center text-sm text-zinc-500">No security alerts.</div>;
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3"
        >
          <span className="shrink-0 text-base">
            {typeIcons[alert.type] || "🔔"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${severityColors[alert.severity] || severityColors.MEDIUM}`}>
                {alert.severity}
              </span>
              <span className="text-xs text-zinc-500">{formatDateTime(alert.createdAt)}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-200">{alert.title}</p>
            {alert.description && (
              <p className="mt-0.5 text-xs text-zinc-500">{alert.description}</p>
            )}
          </div>
          {!alert.resolved && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-red-400 mt-2" />
          )}
        </div>
      ))}
    </div>
  );
}
