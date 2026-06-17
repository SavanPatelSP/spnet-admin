"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { downloadCSV } from "@/lib/export";
import GrantGemsModal from "@/components/gems/GrantGemsModal";
import RevokeGemsModal from "@/components/gems/RevokeGemsModal";
import BulkGrantGemsModal from "@/components/gems/BulkGrantGemsModal";
import BulkRevokeGemsModal from "@/components/gems/BulkRevokeGemsModal";
import SetGemsModal from "@/components/gems/SetGemsModal";
import SetInfiniteGemsButton from "@/components/gems/SetInfiniteGemsButton";
import RemoveInfiniteGemsButton from "@/components/gems/RemoveInfiniteGemsButton";

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

interface GemRewardOption {
  id: string;
  name: string;
  amount: number;
  description: string | null;
}

interface GemsBalancesTableProps {
  balances: BalanceRow[];
  rewards: GemRewardOption[];
}

export default function GemsBalancesTable({ balances, rewards }: GemsBalancesTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGrantOpen, setBulkGrantOpen] = useState(false);
  const [bulkRevokeOpen, setBulkRevokeOpen] = useState(false);

  function handleExportCSV() {
    const headers = ["Organization", "License Key", "Plan", "Balance", "License Status"];
    const rows = balances.map((b) => [b.organization, b.key, b.plan, String(b.balance), b.status]);
    downloadCSV("gem-balances", headers, rows);
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
        bulkActions={
          selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkGrantOpen(true)}
                className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
              >
                Bulk Grant {selectedIds.size}
              </button>
              <button
                onClick={() => setBulkRevokeOpen(true)}
                className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
              >
                Bulk Revoke {selectedIds.size}
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
        rows={balances.map((b) => ({
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
            <span key="balance" className="text-lg font-bold text-purple-400">{b.balance.toLocaleString()}</span>,
            <span key="type" className="flex items-center gap-1">
              {b.isInfinite ? (
                <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">INFINITE</span>
              ) : (
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                  b.type === "PROMOTIONAL" ? "border-green-500/20 bg-green-500/10 text-green-400" :
                  b.type === "REWARD" ? "border-purple-500/20 bg-purple-500/10 text-purple-400" :
                  "border-zinc-600 bg-zinc-800 text-zinc-400"
                }`}>{b.type || "FINITE"}</span>
              )}
            </span>,
            <span key="status"><StatusBadge status={b.status} /></span>,
            <div key="actions" className="flex items-center gap-1.5">
              <GrantGemsModal licenseId={b.licenseId} organization={b.organization} rewards={rewards} />
              {b.balance > 0 && <RevokeGemsModal licenseId={b.licenseId} organization={b.organization} currentBalance={b.balance} />}
              <SetGemsModal licenseId={b.licenseId} organization={b.organization} currentBalance={b.balance} />
              {!b.isInfinite ? (
                <SetInfiniteGemsButton licenseId={b.licenseId} organization={b.organization} />
              ) : (
                <RemoveInfiniteGemsButton licenseId={b.licenseId} organization={b.organization} />
              )}
            </div>,
          ],
        }))}
        searchPlaceholder="Search by organization or license key..."
        emptyMessage="No gem balances yet."
      />

      {bulkGrantOpen && (
        <BulkGrantGemsModal licenseIds={selectedLicenseIds} rewards={rewards} onClose={() => { setBulkGrantOpen(false); setSelectedIds(new Set()); }} />
      )}
      {bulkRevokeOpen && (
        <BulkRevokeGemsModal licenseIds={selectedLicenseIds} onClose={() => { setBulkRevokeOpen(false); setSelectedIds(new Set()); }} />
      )}
    </>
  );
}
