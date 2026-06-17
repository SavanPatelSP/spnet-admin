"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { downloadCSV } from "@/lib/export";
import { LICENSE_STATUSES } from "@/lib/constants";
import AddCoinsModal from "@/components/coins/AddCoinsModal";
import RemoveCoinsModal from "@/components/coins/RemoveCoinsModal";
import BulkAddCoinsModal from "@/components/coins/BulkAddCoinsModal";
import BulkRemoveCoinsModal from "@/components/coins/BulkRemoveCoinsModal";
import SetCoinsModal from "@/components/coins/SetCoinsModal";
import SetInfiniteCoinsButton from "@/components/coins/SetInfiniteCoinsButton";
import RemoveInfiniteCoinsButton from "@/components/coins/RemoveInfiniteCoinsButton";

interface BalanceRow {
  id: string;
  licenseId: string;
  organization: string;
  key: string;
  plan: string;
  status: string;
  balance: number;
  type?: string;
  isInfinite?: boolean;
}

export function CoinsBalancesTable({ balances }: { balances: BalanceRow[] }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkRemoveOpen, setBulkRemoveOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!statusFilter) return balances;
    return balances.filter((b) => b.status === statusFilter);
  }, [balances, statusFilter]);

  function handleExportCSV() {
    const headers = ["Organization", "License Key", "Plan", "Balance", "License Status"];
    const rows = filtered.map((b) => [b.organization, b.key, b.plan, String(b.balance), b.status]);
    downloadCSV("coin-balances", headers, rows);
  }

  const selectedLicenseIds = useMemo(() => {
    return balances.filter((b) => selectedIds.has(b.id)).map((b) => b.licenseId);
  }, [balances, selectedIds]);

  return (
    <>
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
            ]}
            onClear={() => setStatusFilter("")}
          />
        }
        bulkActions={
          selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkAddOpen(true)}
                className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
              >
                Bulk Add {selectedIds.size}
              </button>
              <button
                onClick={() => setBulkRemoveOpen(true)}
                className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
              >
                Bulk Remove {selectedIds.size}
              </button>
            </div>
          )
        }
        columns={[
          { key: "organization", label: "Organization", sortable: true, searchable: true },
          { key: "key", label: "License Key", sortable: true, searchable: true },
          { key: "plan", label: "Plan", sortable: true },
          { key: "balance", label: "Balance", sortable: true },
          { key: "type", label: "Type", sortable: true },
          { key: "status", label: "License Status", sortable: true },
          { key: "actions", label: "Actions", sortable: false, className: "w-72" },
        ]}
        rows={filtered.map((b) => ({
          id: b.id,
          values: {
            organization: b.organization,
            key: b.key,
            plan: b.plan,
            balance: b.balance,
            type: b.isInfinite ? "INFINITE" : (b.type || "FINITE"),
            status: b.status,
          },
          cells: [
            <span key="organization">{b.organization}</span>,
            <Link key="key" href={`/licenses/${b.licenseId}`} className="font-mono text-sm text-blue-400 hover:underline">
              {b.key}
            </Link>,
            <span key="plan" className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium">{b.plan}</span>,
            <span key="balance" className="text-lg font-bold text-yellow-400">{b.balance.toLocaleString()}</span>,
            <span key="type" className="flex items-center gap-1">
              {b.isInfinite ? (
                <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">INFINITE</span>
              ) : (
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                  b.type === "PROMOTIONAL" ? "border-green-500/20 bg-green-500/10 text-green-400" :
                  b.type === "BONUS" ? "border-blue-500/20 bg-blue-500/10 text-blue-400" :
                  "border-zinc-600 bg-zinc-800 text-zinc-400"
                }`}>{b.type || "FINITE"}</span>
              )}
            </span>,
            <StatusBadge key="status" status={b.status} />,
            <div key="actions" className="flex items-center gap-1.5">
              <AddCoinsModal licenseId={b.licenseId} organization={b.organization} />
              {b.balance > 0 && <RemoveCoinsModal licenseId={b.licenseId} organization={b.organization} currentBalance={b.balance} />}
              <SetCoinsModal licenseId={b.licenseId} organization={b.organization} currentBalance={b.balance} />
              {!b.isInfinite ? (
                <SetInfiniteCoinsButton licenseId={b.licenseId} organization={b.organization} />
              ) : (
                <RemoveInfiniteCoinsButton licenseId={b.licenseId} organization={b.organization} />
              )}
            </div>,
          ],
        }))}
        searchPlaceholder="Search by organization or license key..."
        emptyMessage="No coin balances found. Add coins to a license to get started."
      />

      {bulkAddOpen && (
        <BulkAddCoinsModal licenseIds={selectedLicenseIds} onClose={() => { setBulkAddOpen(false); setSelectedIds(new Set()); }} />
      )}
      {bulkRemoveOpen && (
        <BulkRemoveCoinsModal licenseIds={selectedLicenseIds} onClose={() => { setBulkRemoveOpen(false); setSelectedIds(new Set()); }} />
      )}
    </>
  );
}
