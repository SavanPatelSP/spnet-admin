"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { downloadCSV } from "@/lib/export";
import { EXPIRING_SOON_DAYS, DEFAULT_LOCALE, PLANS, LICENSE_STATUSES } from "@/lib/constants";
import { daysUntil } from "@/lib/shared";
import EditLicenseButton from "@/components/licenses/EditLicenseButton";
import ToggleLicenseStatusButton from "@/components/licenses/ToggleLicenseStatusButton";
import RegenerateLicenseButton from "@/components/licenses/RegenerateLicenseButton";
import DeleteLicenseButton from "@/components/licenses/DeleteLicenseButton";
import type { LicenseWithActivations } from "@/types/common";

export function LicensesTable({ licenses: initial }: { licenses: LicenseWithActivations[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  const licenses = useMemo(() => {
    let filtered = initial;
    if (statusFilter) filtered = filtered.filter((l) => l.status === statusFilter);
    if (planFilter) filtered = filtered.filter((l) => l.plan === planFilter);
    return filtered;
  }, [initial, statusFilter, planFilter]);

  function handleExportCSV() {
    const headers = ["License Key", "Organization", "Plan", "Status", "Devices", "Max Devices", "Expires At", "Created At"];
    const rows = licenses.map((l) => [
      l.key,
      l.organization,
      l.plan,
      l.status,
      String(l._count.activations),
      String(l.maxDevices),
      new Date(l.expiresAt).toISOString(),
      new Date(l.createdAt).toISOString(),
    ]);
    downloadCSV("licenses", headers, rows);
  }

  async function bulkSuspend() {
    for (const id of selectedIds) {
      await fetch("/api/licenses/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    }
    setSelectedIds(new Set());
    window.location.reload();
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} licenses? This cannot be undone.`)) return;
    for (const id of selectedIds) {
      await fetch("/api/licenses/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    }
    setSelectedIds(new Set());
    window.location.reload();
  }

  return (
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
              key: "status", label: "All Statuses", value: statusFilter, onChange: setStatusFilter,
              options: LICENSE_STATUSES.map((s) => ({ label: s, value: s })),
            },
            {
              key: "plan", label: "All Plans", value: planFilter, onChange: setPlanFilter,
              options: (PLANS as readonly string[]).map((p) => ({ label: p, value: p })),
            },
          ]}
          onClear={() => { setStatusFilter(""); setPlanFilter(""); }}
        />
      }
      bulkActions={
        selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={bulkSuspend} className="rounded-xl bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-500">
              Suspend {selectedIds.size}
            </button>
            <button onClick={bulkDelete} className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
              Delete {selectedIds.size}
            </button>
          </div>
        )
      }
      columns={[
        { key: "key", label: "License Key", sortable: true, searchable: true },
        { key: "organization", label: "Organization", sortable: true, searchable: true },
        { key: "plan", label: "Plan", sortable: true },
        { key: "activations", label: "Devices", sortable: false },
        { key: "expiresAt", label: "Expiry", sortable: true },
        { key: "status", label: "Status", sortable: true },
        { key: "actions", label: "Actions", sortable: false, className: "w-48" },
      ]}
      rows={licenses.map((l) => {
        const expiry = new Date(l.expiresAt);
        const days = daysUntil(expiry);
        const color = days < 0 ? "text-red-400" : days <= EXPIRING_SOON_DAYS ? "text-yellow-400" : "text-zinc-300";
        return {
          id: String(l.id),
          values: {
            key: l.key,
            organization: l.organization,
            plan: l.plan,
            activations: `${l._count.activations}/${l.maxDevices}`,
            expiresAt: expiry.toISOString(),
            status: l.status,
            actions: "",
          },
          cells: [
            <Link key="key" href={`/licenses/${l.id}`} className="font-mono text-sm text-blue-400 transition-colors hover:text-blue-300 hover:underline">
              {l.key}
            </Link>,
            <span key="organization">{l.organization}</span>,
            <span key="plan" className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium">{l.plan}</span>,
            <span key="activations">{`${l._count.activations}/${l.maxDevices}`}</span>,
            <span key="expiresAt" className={color}>
              {new Intl.DateTimeFormat(DEFAULT_LOCALE, { day: "2-digit", month: "short", year: "numeric" }).format(expiry)}
              {days >= 0 && days <= EXPIRING_SOON_DAYS && <span className="ml-2 text-xs text-yellow-500">({days}d)</span>}
              {days < 0 && <span className="ml-2 text-xs text-red-500">(expired)</span>}
            </span>,
            <span key="status"><StatusBadge status={l.status} /></span>,
            <div key="actions" className="flex items-center gap-1.5">
              <EditLicenseButton license={l} />
              <ToggleLicenseStatusButton id={l.id} status={l.status} size="sm" />
              <RegenerateLicenseButton id={l.id} size="sm" />
              <DeleteLicenseButton id={l.id} size="sm" />
            </div>,
          ],
        };
      })}
      searchPlaceholder="Search by license key or organization..."
      emptyMessage="No licenses found. Create your first license to get started."
    />
  );
}
