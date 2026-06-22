"use client";

import { useState } from "react";
import { X, ExternalLink, Clock, User, Tag, FileText, Activity, Shield } from "lucide-react";
import { cn } from "@/lib/shared";
import { SeverityIndicator } from "@/components/audit/SeverityIndicator";
import { ChangesComparison } from "@/components/audit/ChangesComparison";
import { formatDateTime } from "@/lib/shared";

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

interface EventDetailsDrawerProps {
  event: AuditEvent | null;
  onClose: () => void;
}

const entityIcons: Record<string, typeof Shield> = {
  user: User,
  license: Tag,
  device: Activity,
  security: Shield,
  settings: FileText,
};

function renderEntityIcon(entityType: string | null, size: number, className?: string) {
  const Icon = entityIcons[entityType?.toLowerCase() || ""] || Shield;
  return <Icon size={size} className={className} />;
}

function extractChanges(metadata: Record<string, unknown> | null) {
  if (!metadata?.changes) return [];
  const changes = metadata.changes;
  if (Array.isArray(changes)) return changes as { field: string; before: string; after: string }[];
  return [];
}

export function EventDetailsDrawer({ event, onClose }: EventDetailsDrawerProps) {
  const [tab, setTab] = useState<"overview" | "changes" | "impact" | "related">("overview");

  if (!event) return null;

  const changes = extractChanges(event.metadata);

  const tabs = [
    { id: "overview" as const, label: "Overview", count: null },
    { id: "changes" as const, label: "Changes", count: changes.length },
    { id: "impact" as const, label: "Impact", count: null },
    { id: "related" as const, label: "Related", count: null },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-zinc-800 bg-zinc-900 shadow-2xl transition-transform">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-800">
                {renderEntityIcon(event.entityType, 18, "text-zinc-400")}
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">{event.action.replace(/_/g, " ")}</h2>
                <p className="text-xs text-zinc-500">Event Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex border-b border-zinc-800 px-6">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  tab === t.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300",
                )}
              >
                {t.label}
                {t.count !== null && t.count > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-zinc-800 px-1.5 text-[10px] font-bold text-zinc-400">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === "overview" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
                  <span className="text-sm text-zinc-400">Severity</span>
                  <SeverityIndicator severity={event.severity} />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
                  <span className="text-sm text-zinc-400">Timestamp</span>
                  <span className="flex items-center gap-1.5 text-sm text-zinc-300">
                    <Clock size={14} className="text-zinc-500" />
                    {formatDateTime(event.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
                  <span className="text-sm text-zinc-400">Actor</span>
                  <span className="flex items-center gap-1.5 text-sm text-zinc-300">
                    <User size={14} className="text-zinc-500" />
                    {event.actorName || event.actorEmail || "Unknown"}
                  </span>
                </div>
                {event.actorEmail && event.actorName && (
                  <div className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
                    <span className="text-sm text-zinc-400">Email</span>
                    <span className="text-sm text-zinc-300">{event.actorEmail}</span>
                  </div>
                )}
                {event.entityType && (
                  <div className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
                    <span className="text-sm text-zinc-400">Entity Type</span>
                    <span className="flex items-center gap-1.5 text-sm text-zinc-300">
                      <Tag size={14} className="text-zinc-500" />
                      {event.entityType}
                    </span>
                  </div>
                )}
                {event.entityId && (
                  <div className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
                    <span className="text-sm text-zinc-400">Entity ID</span>
                    <span className="flex items-center gap-1.5 text-sm text-zinc-300">
                      <ExternalLink size={14} className="text-zinc-500" />
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">{event.entityId}</code>
                    </span>
                  </div>
                )}
                {event.description && (
                  <div className="rounded-xl bg-zinc-800/30 p-4">
                    <span className="text-sm text-zinc-400">Description</span>
                    <p className="mt-1 text-sm text-zinc-300">{event.description}</p>
                  </div>
                )}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="rounded-xl bg-zinc-800/30 p-4">
                    <span className="text-sm text-zinc-400">Metadata</span>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-400">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {tab === "changes" && (
              <div className="space-y-4">
                {changes.length > 0 ? (
                  <ChangesComparison changes={changes} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText size={32} className="text-zinc-600" />
                    <p className="mt-3 text-sm text-zinc-500">No changes recorded for this event</p>
                  </div>
                )}
              </div>
            )}

            {tab === "impact" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-zinc-800/30 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-zinc-300">Impact Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
                      <span className="text-sm text-zinc-400">Affected Entity</span>
                      <span className="text-sm text-zinc-300">{event.entityType || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
                      <span className="text-sm text-zinc-400">Action Type</span>
                      <span className="text-sm text-zinc-300">{event.action}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
                      <span className="text-sm text-zinc-400">Severity Level</span>
                      <SeverityIndicator severity={event.severity} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "related" && (
              <div className="flex flex-col items-center justify-center py-12">
                <Activity size={32} className="text-zinc-600" />
                <p className="mt-3 text-sm text-zinc-500">No related events found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
