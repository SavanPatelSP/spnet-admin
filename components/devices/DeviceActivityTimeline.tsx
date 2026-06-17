"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { formatDateTime } from "@/lib/shared";
import { AlertTriangle, Activity } from "lucide-react";

interface AuditLogEntry {
  id: string;
  action: string;
  description: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: Date;
}

interface Props {
  logs: AuditLogEntry[];
  deviceName: string;
  totalOrgActivations: number;
}

const actionStyles: Record<string, string> = {
  DEVICE_REVOKED: "bg-red-500/10 text-red-400 border-red-500/20",
  ACTIVATION_DELETED: "bg-red-500/10 text-red-400 border-red-500/20",
  LOGIN_SUCCESS: "bg-green-500/10 text-green-400 border-green-500/20",
  LOGIN_FAILURE: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

function getActionStyle(action: string): string {
  return actionStyles[action] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

export function DeviceActivityTimeline({ logs, deviceName: _deviceName, totalOrgActivations }: Props) {
  const [actionFilter, setActionFilter] = useState("");

  const filtered = useMemo(() => {
    if (!actionFilter) return logs;
    return logs.filter((l) => l.action === actionFilter);
  }, [logs, actionFilter]);

  const uniqueActions = useMemo(() => [...new Set(logs.map((l) => l.action))], [logs]);

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Device Activity Timeline</h2>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Activity size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total Events</p>
              <p className="text-xl font-bold">{logs.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <AlertTriangle size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Org Activations</p>
              <p className="text-xl font-bold">{totalOrgActivations}</p>
            </div>
          </div>
        </div>
      </div>

      {logs.length > 0 ? (
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
              actor: l.actorName || l.actorEmail || "",
            },
            cells: [
              <span key="date" className="text-sm text-zinc-400">{formatDateTime(l.createdAt)}</span>,
              <span key="action" className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getActionStyle(l.action)}`}>
                {l.action.replace(/_/g, " ")}
              </span>,
              <span key="description" className="text-sm">{l.description || "-"}</span>,
              <span key="actor" className="text-sm text-zinc-500">{l.actorName || l.actorEmail || "System"}</span>,
            ],
          }))}
          searchPlaceholder="Search activity..."
          emptyMessage="No matching events found."
        />
      ) : (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">No activity events recorded for this device.</p>
        </div>
      )}
    </div>
  );
}
