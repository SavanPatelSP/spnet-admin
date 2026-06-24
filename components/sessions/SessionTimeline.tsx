"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/shared";
import { Crown, ArrowUpCircle, LogOut, Clock, Shield, AlertTriangle, RefreshCw, Timer, User, Activity } from "lucide-react";

interface TimelineEvent {
  id: string;
  action: string;
  description: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  SESSION_EXTENDED: <ArrowUpCircle size={14} className="text-blue-400" />,
  SESSION_POLICY_OVERRIDDEN: <Crown size={14} className="text-purple-400" />,
  LOGIN_TENURE_OVERRIDDEN: <Timer size={14} className="text-amber-400" />,
  SESSION_REVOKED: <LogOut size={14} className="text-red-400" />,
  SESSION_CREATED: <Activity size={14} className="text-green-400" />,
  PERMISSION_DENIED: <Shield size={14} className="text-red-400" />,
};

const ACTION_COLORS: Record<string, string> = {
  SESSION_EXTENDED: "border-blue-500/30 bg-blue-500/10",
  SESSION_POLICY_OVERRIDDEN: "border-purple-500/30 bg-purple-500/10",
  LOGIN_TENURE_OVERRIDDEN: "border-amber-500/30 bg-amber-500/10",
  SESSION_REVOKED: "border-red-500/30 bg-red-500/10",
  SESSION_CREATED: "border-green-500/30 bg-green-500/10",
  PERMISSION_DENIED: "border-red-500/30 bg-red-500/10",
};

function TimelineIcon({ action }: { action: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800">
      {ACTION_ICONS[action] || <Clock size={14} className="text-zinc-500" />}
    </div>
  );
}

export function SessionTimeline({ events: initialEvents }: { events: TimelineEvent[] }) {
  const [events, setEvents] = useState(initialEvents);

  useEffect(() => {
    function onSessionUpdated(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.sessionId && detail?.description) {
        setEvents((prev) => [
          {
            id: `live-${Date.now()}`,
            action: detail.action || "SESSION_EXTENDED",
            description: detail.description,
            actorName: detail.actorName || "System",
            actorEmail: detail.actorEmail || "",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    }
    window.addEventListener("session-updated", onSessionUpdated);
    return () => window.removeEventListener("session-updated", onSessionUpdated);
  }, []);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <Activity size={24} className="mb-2 opacity-50" />
        <p className="text-sm">No audit events recorded for this session.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {events.map((event, i) => (
        <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {i < events.length - 1 && (
            <div className="absolute left-4 top-8 bottom-0 w-px bg-zinc-800" />
          )}
          <TimelineIcon action={event.action} />
          <div className={`flex-1 rounded-lg border p-3 ${ACTION_COLORS[event.action] || "border-zinc-800 bg-zinc-900/30"}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-zinc-200">
                {event.action.replace(/_/g, " ")}
              </p>
              <span className="shrink-0 text-[10px] text-zinc-500">
                {formatDateTime(event.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{event.description}</p>
            {event.actorName && (
              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-500">
                <User size={8} />
                {event.actorName}{event.actorEmail ? ` (${event.actorEmail})` : ""}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
