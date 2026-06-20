"use client";

import { useMemo } from "react";
import {
  User, Tag, Monitor, Shield, FileText, AlertTriangle, AlertCircle, Info, Circle,
  type LucideIcon,
} from "lucide-react";
import { cn, formatDateTime } from "@/lib/shared";
import { SeverityIndicator } from "@/components/audit/SeverityIndicator";

interface AuditEvent {
  id: string;
  action: string;
  severity: string;
  entityType: string | null;
  entityId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditTimelineProps {
  events: AuditEvent[];
  onEventClick: (event: AuditEvent) => void;
}

const entityIcons: Record<string, LucideIcon> = {
  user: User,
  license: Tag,
  device: Monitor,
  security: Shield,
  settings: FileText,
};

function getEntityIcon(entityType: string | null): LucideIcon {
  if (!entityType) return Shield;
  return entityIcons[entityType.toLowerCase()] || Shield;
}

function getActionIcon(action: string): LucideIcon {
  const lower = action.toLowerCase();
  if (lower.includes("delete") || lower.includes("revoke") || lower.includes("blacklist")) return AlertTriangle;
  if (lower.includes("fail") || lower.includes("denied") || lower.includes("suspend")) return AlertCircle;
  if (lower.includes("create") || lower.includes("grant") || lower.includes("enable")) return Info;
  return Circle;
}

function getRelativeDay(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.round((todayStart.getTime() - dateStart.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return DAYS[date.getDay()];
  }
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function AuditTimeline({ events, onEventClick }: AuditTimelineProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, AuditEvent[]> = {};
    for (const event of events) {
      const day = getRelativeDay(event.createdAt);
      if (!groups[day]) groups[day] = [];
      groups[day].push(event);
    }
    return groups;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/50 py-16">
        <Shield size={40} className="text-zinc-600" />
        <p className="mt-4 text-sm text-zinc-500">No audit events found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([day, dayEvents]) => (
        <div key={day}>
          <h3 className="mb-4 text-sm font-semibold text-zinc-500">{day}</h3>
          <div className="relative space-y-2 pl-8 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-zinc-800">
            {dayEvents.map((event) => {
              const EntityIcon = getEntityIcon(event.entityType);
              const ActionIcon = getActionIcon(event.action);

              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="group relative w-full rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/30"
                >
                  <div className="absolute -left-6 top-5 flex h-4 w-4 items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-zinc-700 ring-2 ring-zinc-900 group-hover:bg-zinc-500" />
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
                      <EntityIcon size={14} className="text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-200">
                            <span className="text-zinc-500">{event.actorName || event.actorEmail || "System"}</span>
                            {" "}{event.description || event.action.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <SeverityIndicator severity={event.severity} size="sm" />
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs text-zinc-600">{formatDateTime(event.createdAt)}</span>
                        {event.entityType && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                            <ActionIcon size={8} />
                            {event.entityType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
