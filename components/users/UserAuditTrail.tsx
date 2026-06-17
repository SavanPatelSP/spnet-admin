"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { formatDateTime } from "@/lib/shared";

interface AuditLogEntry {
  id: string;
  action: string;
  description: string | null;
  actorName: string | null;
  createdAt: Date;
}

interface Props {
  logs: AuditLogEntry[];
}

const actionColors: Record<string, string> = {
  TEAM_MEMBER_CREATED: "bg-green-500/10 text-green-400 border-green-500/20",
  TEAM_MEMBER_SUSPENDED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  TEAM_MEMBER_REACTIVATED: "bg-green-500/10 text-green-400 border-green-500/20",
  TEAM_MEMBER_ROLE_CHANGED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  TEAM_MEMBER_DELETED: "bg-red-500/10 text-red-400 border-red-500/20",
  PASSWORD_RESET: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  LOGIN_SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  LOGIN_FAILURE: "bg-red-500/10 text-red-400 border-red-500/20",
  PERMISSION_DENIED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

function getActionStyle(action: string): string {
  return actionColors[action] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

export function UserAuditTrail({ logs }: Props) {
  const [actionFilter, setActionFilter] = useState("");

  const filtered = useMemo(() => {
    if (!actionFilter) return logs;
    return logs.filter((l) => l.action === actionFilter);
  }, [logs, actionFilter]);

  const uniqueActions = useMemo(() => [...new Set(logs.map((l) => l.action))], [logs]);

  if (logs.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-2 text-xl font-bold">Activity History</h2>
        <p className="text-sm text-zinc-500">No activity recorded for this user.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Activity History</h2>
      <DataTable
        filters={
          <FilterBar
            filters={[
              {
                key: "action",
                label: "All Actions",
                value: actionFilter,
                onChange: setActionFilter,
                options: uniqueActions.map((a) => ({ label: a.replace(/_/g, " "), value: a })),
              },
            ]}
            onClear={() => setActionFilter("")}
          />
        }
        columns={[
          { key: "date", label: "Date", sortable: true },
          { key: "action", label: "Action", sortable: true },
          { key: "description", label: "Description", sortable: false, searchable: true },
          { key: "actor", label: "Actor", sortable: true },
        ]}
        rows={filtered.map((l) => ({
          id: l.id,
          values: {
            date: l.createdAt.toISOString(),
            action: l.action,
            description: l.description || "",
            actor: l.actorName || "",
          },
          cells: [
            <span key="date" className="text-sm text-zinc-400">{formatDateTime(l.createdAt)}</span>,
            <span key="action" className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getActionStyle(l.action)}`}>
              {l.action.replace(/_/g, " ")}
            </span>,
            <span key="description" className="text-sm">{l.description || "-"}</span>,
            <span key="actor" className="text-sm text-zinc-500">{l.actorName || "System"}</span>,
          ],
        }))}
        searchPlaceholder="Search activity descriptions..."
        emptyMessage="No matching activity found."
      />
    </div>
  );
}
