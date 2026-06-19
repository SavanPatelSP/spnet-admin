"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { formatDate } from "@/lib/shared";
import { API_ROUTES } from "@/lib/constants";
import { Clock, XCircle } from "lucide-react";

interface SessionRow {
  id: string;
  teamMemberId: string;
  teamMember: { name: string; email: string } | null;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export function SessionsTable({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userFilter, setUserFilter] = useState("");

  const users = useMemo(
    () => [...new Set(sessions.map((s) => s.teamMember?.email).filter((e): e is string => !!e))].sort(),
    [sessions]
  );

  const filtered = useMemo(() => {
    if (!userFilter) return sessions;
    return sessions.filter((s) => s.teamMember?.email === userFilter);
  }, [sessions, userFilter]);

  async function bulkRevoke() {
    if (!confirm(`Revoke ${selectedIds.size} session${selectedIds.size > 1 ? "s" : ""}?`)) return;
    for (const id of selectedIds) {
      await fetch(API_ROUTES.TEAM_MEMBERS.SESSIONS_REVOKE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  return (
    <DataTable
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      filters={
        <FilterBar
          filters={[
            {
              key: "user",
              label: "All Users",
              value: userFilter,
              onChange: setUserFilter,
              options: users.map((u) => ({ label: u, value: u })),
            },
          ]}
          onClear={() => setUserFilter("")}
        />
      }
      bulkActions={
        selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={bulkRevoke} className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
              <XCircle size={14} className="mr-1 inline" />
              Revoke {selectedIds.size}
            </button>
          </div>
        )
      }
      columns={[
        { key: "user", label: "User", sortable: true, searchable: true },
        { key: "ipAddress", label: "IP Address", sortable: true },
        { key: "status", label: "Status", sortable: true },
        { key: "createdAt", label: "Created", sortable: true },
        { key: "expiresAt", label: "Expires", sortable: true },
        { key: "actions", label: "Actions", className: "w-20" },
      ]}
      rows={filtered.map((s) => {
        const isActive = s.expiresAt > new Date();
        return {
          id: s.id,
          values: {
            user: s.teamMember?.name || s.teamMember?.email || "Unknown",
            ipAddress: s.ipAddress || "",
            status: isActive ? "Active" : "Expired",
            createdAt: s.createdAt.toISOString(),
            expiresAt: s.expiresAt.toISOString(),
            actions: "",
          },
          cells: [
            <div key="user" className="min-w-0">
              <p className="text-sm font-medium text-zinc-200">{s.teamMember?.name || "Unknown"}</p>
              <p className="text-xs text-zinc-500">{s.teamMember?.email || ""}</p>
            </div>,
            <span key="ip" className="font-mono text-xs text-zinc-400">{s.ipAddress || "-"}</span>,
            <span key="status">
              {isActive ? (
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                  Active
                </span>
              ) : (
                <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-400">
                  Expired
                </span>
              )}
            </span>,
            <span key="created" className="text-xs text-zinc-400">{formatDate(s.createdAt)}</span>,
            <span key="expires" className="flex items-center gap-1 text-xs text-zinc-400">
              <Clock size={10} />
              {formatDate(s.expiresAt)}
            </span>,
            <button
              key="actions"
              onClick={async () => {
                if (!confirm("Revoke this session?")) return;
                await fetch(API_ROUTES.TEAM_MEMBERS.SESSIONS_REVOKE, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId: s.id }),
                });
                router.refresh();
              }}
              className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              Revoke
            </button>,
          ],
        };
      })}
      searchPlaceholder="Search by user name or email..."
      emptyMessage="No sessions found."
    />
  );
}
