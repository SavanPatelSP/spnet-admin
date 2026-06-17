"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { downloadCSV } from "@/lib/export";
import { API_ROUTES } from "@/lib/constants";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
}

interface UsersTableProps {
  users: UserRow[];
  roles: string[];
}

export function UsersTable({ users, roles }: UsersTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filtered = useMemo(() => {
    let f = users;
    if (statusFilter) f = f.filter((u) => u.status === statusFilter);
    if (roleFilter) f = f.filter((u) => u.role === roleFilter);
    return f;
  }, [users, statusFilter, roleFilter]);

  function handleExportCSV() {
    const headers = ["Name", "Email", "Role", "Status", "Last Login", "Joined"];
    const rows = filtered.map((u) => [
      u.name,
      u.email,
      u.role,
      u.status,
      u.lastLogin || "Never",
      u.createdAt,
    ]);
    downloadCSV("users", headers, rows);
  }

  async function bulkSuspend() {
    for (const id of selectedIds) {
      await fetch(API_ROUTES.TEAM_MEMBERS.UPDATE_STATUS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "SUSPENDED" }),
      });
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  async function bulkReactivate() {
    for (const id of selectedIds) {
      await fetch(API_ROUTES.TEAM_MEMBERS.UPDATE_STATUS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "ACTIVE" }),
      });
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} team member${selectedIds.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    for (const id of selectedIds) {
      await fetch(API_ROUTES.TEAM_MEMBERS.DELETE, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
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
      exportable
      onExport={handleExportCSV}
      onRowClick={(id) => router.push(`/users/${id}`)}
      filters={
        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "ACTIVE", value: "ACTIVE" },
                { label: "SUSPENDED", value: "SUSPENDED" },
              ],
            },
            {
              key: "role",
              label: "All Roles",
              value: roleFilter,
              onChange: setRoleFilter,
              options: roles.map((r) => ({ label: r, value: r })),
            },
          ]}
          onClear={() => { setStatusFilter(""); setRoleFilter(""); }}
        />
      }
      bulkActions={
        selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={bulkSuspend}
              className="rounded-xl bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-500"
            >
              Suspend {selectedIds.size}
            </button>
            <button
              onClick={bulkReactivate}
              className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
            >
              Reactivate {selectedIds.size}
            </button>
            <button
              onClick={bulkDelete}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
            >
              Delete {selectedIds.size}
            </button>
          </div>
        )
      }
      columns={[
        { key: "name", label: "Name", sortable: true, searchable: true },
        { key: "email", label: "Email", sortable: true, searchable: true },
        { key: "role", label: "Role", sortable: true },
        { key: "status", label: "Status", sortable: true },
        { key: "lastLogin", label: "Last Login", sortable: true },
        { key: "createdAt", label: "Joined", sortable: true },
      ]}
      rows={filtered.map((u) => ({
        id: u.id,
        values: {
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          lastLogin: u.lastLogin || "",
          createdAt: u.createdAt,
        },
        cells: [
          <span key="name" className="font-medium">{u.name}</span>,
          <span key="email">{u.email}</span>,
          <span key="role" className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium">
            {u.role}
          </span>,
          <span key="status"><StatusBadge status={u.status} /></span>,
          <span key="lastLogin" className="text-sm text-zinc-400">{u.lastLogin || "Never"}</span>,
          <span key="createdAt" className="text-sm text-zinc-400">{u.createdAt}</span>,
        ],
      }))}
      searchPlaceholder="Search by name, email, or role..."
      emptyMessage="No team members found. Invite members to get started."
    />
  );
}
