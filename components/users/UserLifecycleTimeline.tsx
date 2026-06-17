"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, formatDateTime } from "@/lib/shared";
import { API_ROUTES } from "@/lib/constants";
import {
  Circle,
  UserPlus,
  Ban,
  CheckCircle,
  Archive,
  RotateCcw,
  Loader2,
} from "lucide-react";

interface LifecycleEvent {
  id: string;
  action: string;
  description: string | null;
  createdAt: string;
}

const colorMap: Record<string, string> = {
  TEAM_MEMBER_CREATED: "bg-green-500",
  TEAM_MEMBER_SUSPENDED: "bg-yellow-500",
  TEAM_MEMBER_REACTIVATED: "bg-green-500",
  USER_LIFECYCLE_ARCHIVED: "bg-red-500",
  USER_LIFECYCLE_RESTORED: "bg-blue-500",
  TEAM_MEMBER_DELETED: "bg-red-500",
};

const iconMap: Record<string, React.ReactNode> = {
  TEAM_MEMBER_CREATED: <UserPlus size={14} />,
  TEAM_MEMBER_SUSPENDED: <Ban size={14} />,
  TEAM_MEMBER_REACTIVATED: <CheckCircle size={14} />,
  USER_LIFECYCLE_ARCHIVED: <Archive size={14} />,
  USER_LIFECYCLE_RESTORED: <RotateCcw size={14} />,
  TEAM_MEMBER_DELETED: <Ban size={14} />,
};

const lifecycleActions = new Set([
  "TEAM_MEMBER_CREATED",
  "TEAM_MEMBER_SUSPENDED",
  "TEAM_MEMBER_REACTIVATED",
  "USER_LIFECYCLE_ARCHIVED",
  "USER_LIFECYCLE_RESTORED",
  "TEAM_MEMBER_DELETED",
]);

interface Props {
  teamMemberId: string;
}

export function UserLifecycleTimeline({ teamMemberId }: Props) {
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [loginRes, auditRes] = await Promise.all([
        fetch(`${API_ROUTES.TEAM_MEMBERS.LOGIN_HISTORY}?teamMemberId=${teamMemberId}`),
        fetch(`/api/audit?teamMemberId=${teamMemberId}`),
      ]);

      const lifecycle: LifecycleEvent[] = [];

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        const logs = loginData.logs ?? loginData ?? [];
        for (const log of logs) {
          if (log.action && lifecycleActions.has(log.action)) {
            lifecycle.push({
              id: log.id,
              action: log.action,
              description: log.description,
              createdAt: log.createdAt,
            });
          }
        }
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        const auditLogs = auditData.logs ?? auditData ?? [];
        for (const log of auditLogs) {
          if (log.action && lifecycleActions.has(log.action)) {
            if (!lifecycle.some((e) => e.id === log.id)) {
              lifecycle.push({
                id: log.id,
                action: log.action,
                description: log.description,
                createdAt: log.createdAt,
              });
            }
          }
        }
      }

      lifecycle.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setEvents(lifecycle);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [teamMemberId]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchEvents();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
          <Circle size={32} className="text-zinc-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-300">No Lifecycle Events</h3>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          No lifecycle events recorded for this user.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Lifecycle Timeline</h2>
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="relative">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-zinc-800" />
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start gap-4 pl-10">
                <div
                  className={cn(
                    "absolute left-2.5 flex h-5 w-5 items-center justify-center rounded-full text-zinc-900",
                    colorMap[event.action] || "bg-zinc-600"
                  )}
                >
                  {iconMap[event.action] || <Circle size={14} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">
                      {event.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDateTime(event.createdAt)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-sm text-zinc-400">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
