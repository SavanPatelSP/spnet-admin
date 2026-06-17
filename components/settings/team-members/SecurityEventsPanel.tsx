"use client";

import { useMemo } from "react";
import { formatDateTime } from "@/lib/shared";
import { Shield, ShieldAlert, ShieldCheck, LogIn, Ban, AlertTriangle } from "lucide-react";

interface AuditEvent {
  id: string;
  action: string;
  description: string | null;
  actorEmail: string | null;
  createdAt: Date;
}

interface SecurityEventsPanelProps {
  events: AuditEvent[];
}

const securityActions = new Set([
  "LOGIN_FAILURE", "LOGIN_SUCCESS", "LOGOUT", "PERMISSION_DENIED",
  "TEAM_MEMBER_SUSPENDED", "TEAM_MEMBER_REACTIVATED",
  "PASSWORD_RESET", "EMERGENCY_LOCKDOWN",
]);

export default function SecurityEventsPanel({ events }: SecurityEventsPanelProps) {
  const securityEvents = useMemo(() =>
    events.filter((e) => securityActions.has(e.action)).slice(0, 50),
    [events],
  );

  const getIcon = (action: string) => {
    if (action === "LOGIN_SUCCESS") return <LogIn size={14} className="text-green-400" />;
    if (action === "LOGIN_FAILURE") return <AlertTriangle size={14} className="text-red-400" />;
    if (action === "PERMISSION_DENIED") return <ShieldAlert size={14} className="text-yellow-400" />;
    if (action === "PASSWORD_RESET") return <ShieldCheck size={14} className="text-blue-400" />;
    if (action === "EMERGENCY_LOCKDOWN") return <Ban size={14} className="text-red-400" />;
    return <Shield size={14} className="text-zinc-400" />;
  };

  const getColor = (action: string) => {
    if (action === "LOGIN_SUCCESS") return "border-green-500/20 bg-green-500/5";
    if (action === "LOGIN_FAILURE" || action === "EMERGENCY_LOCKDOWN") return "border-red-500/20 bg-red-500/5";
    if (action === "PERMISSION_DENIED") return "border-yellow-500/20 bg-yellow-500/5";
    return "border-zinc-700/50 bg-zinc-800/30";
  };

  if (securityEvents.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={16} className="text-blue-400" />
          <h3 className="font-semibold">Security Events</h3>
        </div>
        <p className="text-sm text-zinc-500">No security events recorded.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-blue-400" />
          <h3 className="font-semibold">Security Events</h3>
        </div>
        <span className="text-xs text-zinc-500">Last 50 events</span>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {securityEvents.map((e) => (
          <div key={e.id} className={`flex items-start gap-3 rounded-xl border p-3 ${getColor(e.action)}`}>
            <div className="mt-0.5 shrink-0">{getIcon(e.action)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-300">{e.description || e.action}</p>
              <p className="text-xs text-zinc-500">{e.actorEmail && `${e.actorEmail} · `}{formatDateTime(e.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
