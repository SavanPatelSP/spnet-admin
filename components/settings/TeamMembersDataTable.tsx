"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { downloadCSV } from "@/lib/export";
import { API_ROUTES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/shared";
import RoleSelector from "@/components/settings/team-members/RoleSelector";
import dynamic from "next/dynamic";
import MemberActions from "@/components/settings/team-members/MemberActions";

const EditMemberModal = dynamic(() => import("@/components/settings/team-members/EditMemberModal"), { ssr: false });
import { Shield, ShieldOff, Clock, Smartphone } from "lucide-react";

interface MemberRow {
  id: string;
  name: string;
  email: string;
  status: string;
  roleId: string;
  roleName: string;
  createdAt: Date;
  lastLogin?: Date | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  licenseId?: string | null;
}

interface TeamMembersDataTableProps {
  members: MemberRow[];
  roles: { id: string; name: string }[];
  currentUserRole?: string;
}

export default function TeamMembersDataTable({ members, roles, currentUserRole }: TeamMembersDataTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false);
  const [bulkReactivateOpen, setBulkReactivateOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const filtered = useMemo(() => {
    let f = members;
    if (statusFilter) f = f.filter((m) => m.status === statusFilter);
    if (roleFilter) f = f.filter((m) => m.roleName === roleFilter);
    return f;
  }, [members, statusFilter, roleFilter]);

  function handleExportCSV() {
    const headers = ["Name", "Email", "Role", "Status", "Last Login", "MFA", "Created"];
    const rows = filtered.map((m) => [
      m.name, m.email, m.roleName, m.status,
      m.lastLogin ? formatDateTime(m.lastLogin) : "Never",
      "N/A",
      formatDate(m.createdAt),
    ]);
    downloadCSV("team-members", headers, rows);
  }

  async function bulkSuspend() {
    setBulkLoading(true);
    setBulkError("");
    try {
      await Promise.allSettled(
        Array.from(selectedIds).map((id) =>
          fetch(API_ROUTES.TEAM_MEMBERS.UPDATE_STATUS, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: "SUSPENDED" }),
          })
        )
      );
      setSelectedIds(new Set());
      setBulkSuspendOpen(false);
      router.refresh();
    } catch {
      setBulkError("Network error during bulk operation");
    } finally {
      setBulkLoading(false);
    }
  }

  async function bulkReactivate() {
    setBulkLoading(true);
    setBulkError("");
    try {
      await Promise.allSettled(
        Array.from(selectedIds).map((id) =>
          fetch(API_ROUTES.TEAM_MEMBERS.UPDATE_STATUS, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: "ACTIVE" }),
          })
        )
      );
      setSelectedIds(new Set());
      setBulkReactivateOpen(false);
      router.refresh();
    } catch {
      setBulkError("Network error during bulk operation");
    } finally {
      setBulkLoading(false);
    }
  }

  async function bulkDelete() {
    setBulkLoading(true);
    setBulkError("");
    try {
      await Promise.allSettled(
        Array.from(selectedIds).map((id) =>
          fetch(API_ROUTES.TEAM_MEMBERS.DELETE, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          })
        )
      );
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      router.refresh();
    } catch {
      setBulkError("Network error during bulk operation");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Directory</h2>
          <p className="text-sm text-zinc-500">Manage members, roles and access.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400">
          {members.length} Member{members.length !== 1 ? "s" : ""}
        </div>
      </div>

      <DataTable
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        exportable
        onExport={handleExportCSV}
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
                options: roles.map((r) => ({ label: r.name, value: r.name })),
              },
            ]}
            onClear={() => { setStatusFilter(""); setRoleFilter(""); }}
          />
        }
        bulkActions={
          selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setBulkSuspendOpen(true)} className="rounded-xl bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-500">
                Suspend {selectedIds.size}
              </button>
              <button onClick={() => setBulkReactivateOpen(true)} className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500">
                Reactivate {selectedIds.size}
              </button>
              <button onClick={() => setBulkDeleteOpen(true)} className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
                Delete {selectedIds.size}
              </button>
            </div>
          )
        }
        columns={[
          { key: "member", label: "Member", sortable: true, searchable: true },
          { key: "role", label: "Role", sortable: true },
          { key: "status", label: "Status", sortable: true },
          { key: "lastLogin", label: "Last Login", sortable: true },
          { key: "security", label: "Security", sortable: false },
          { key: "mfa", label: "MFA", sortable: false },
          { key: "createdAt", label: "Created", sortable: true },
          { key: "actions", label: "Actions", sortable: false, className: "w-64" },
        ]}
        rows={filtered.map((m) => ({
          id: m.id,
          values: {
            member: m.name,
            role: m.roleName,
            status: m.status,
            lastLogin: m.lastLogin ? m.lastLogin.toISOString() : "",
            createdAt: m.createdAt.toISOString(),
          },
          cells: [
            <div key="member">
              <div className="font-medium">{m.name}</div>
              <div className="text-sm text-zinc-500">{m.email}</div>
            </div>,
            <span key="role"><RoleSelector memberId={m.id} currentRoleId={m.roleId} roles={roles} /></span>,
            <span key="status"><StatusBadge status={m.status} /></span>,
            <div key="lastLogin" className="flex items-center gap-1.5">
              <Clock size={12} className="text-zinc-500" />
              <span className="text-sm text-zinc-400">
                {m.lastLogin ? formatDateTime(m.lastLogin) : "Never"}
              </span>
            </div>,
            <div key="security" className="flex items-center gap-1.5">
              {(m.failedLoginAttempts ?? 0) > 0 || m.lockedUntil ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                  <ShieldOff size={10} />
                  {m.lockedUntil ? "Locked" : `${m.failedLoginAttempts} failures`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                  <Shield size={10} />
                  Clean
                </span>
              )}
            </div>,
            <span key="mfa" className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
              <Smartphone size={10} />
              N/A
            </span>,
            <span key="createdAt" className="text-sm text-zinc-500">{formatDate(m.createdAt)}</span>,
            <div key="actions" className="flex items-center gap-1.5">
              <EditMemberModal
                member={{
                  id: m.id,
                  name: m.name,
                  email: m.email,
                  roleId: m.roleId,
                  status: m.status,
                  licenseId: m.licenseId,
                  lastLogin: m.lastLogin?.toISOString() ?? null,
                }}
                roles={roles}
              />
              <MemberActions memberId={m.id} memberName={m.name} memberEmail={m.email} memberRole={m.roleName} status={m.status} currentUserRole={currentUserRole} />
            </div>,
          ],
        }))}
        searchPlaceholder="Search by name or email..."
        emptyMessage="No team members found."
      />

      <ConfirmDialog
        open={bulkSuspendOpen}
        onClose={() => { setBulkSuspendOpen(false); setBulkError(""); }}
        onConfirm={bulkSuspend}
        title="Bulk Suspend Members"
        description={`Suspend ${selectedIds.size} team member${selectedIds.size > 1 ? "s" : ""}? They will lose access until reactivated.`}
        confirmLabel={`Suspend ${selectedIds.size}`}
        variant="danger"
        loading={bulkLoading}
        error={bulkError}
      />
      <ConfirmDialog
        open={bulkReactivateOpen}
        onClose={() => { setBulkReactivateOpen(false); setBulkError(""); }}
        onConfirm={bulkReactivate}
        title="Bulk Reactivate Members"
        description={`Reactivate ${selectedIds.size} team member${selectedIds.size > 1 ? "s" : ""}?`}
        confirmLabel={`Reactivate ${selectedIds.size}`}
        variant="primary"
        loading={bulkLoading}
        error={bulkError}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => { setBulkDeleteOpen(false); setBulkError(""); }}
        onConfirm={bulkDelete}
        title="Bulk Delete Members"
        description={`Delete ${selectedIds.size} team member${selectedIds.size > 1 ? "s" : ""}? This cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.size}`}
        variant="danger"
        loading={bulkLoading}
        error={bulkError}
      />
    </div>
  );
}
