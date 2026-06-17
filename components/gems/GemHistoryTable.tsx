"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { downloadCSV } from "@/lib/export";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { Gift } from "lucide-react";

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  reason: string | null;
  performedBy: string | null;
  createdAt: Date;
  organization: string;
  rewardName: string | null;
}

const GEM_TX_TYPES = ["GRANT", "REVOKE", "REWARD", "ADJUSTMENT"];

const typeColors: Record<string, string> = {
  GRANT: "bg-green-500/10 text-green-400 border-green-500/20",
  REVOKE: "bg-red-500/10 text-red-400 border-red-500/20",
  REWARD: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ADJUSTMENT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export function GemHistoryTable({ transactions }: { transactions: TransactionRow[] }) {
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = useMemo(() => {
    if (!typeFilter) return transactions;
    return transactions.filter((t) => t.type === typeFilter);
  }, [transactions, typeFilter]);

  function handleExportCSV() {
    const headers = ["Date", "Organization", "Type", "Amount", "Balance After", "Reason", "Performed By"];
    const rows = filtered.map((t) => [
      new Date(t.createdAt).toISOString(),
      t.organization,
      t.rewardName || t.type,
      String(t.amount),
      String(t.balanceAfter),
      t.reason || "-",
      t.performedBy || "-",
    ]);
    downloadCSV("gem-transactions", headers, rows);
  }

  return (
    <DataTable
      exportable
      onExport={handleExportCSV}
      filters={
        <FilterBar
          filters={[
            {
              key: "type", label: "All Types", value: typeFilter, onChange: setTypeFilter,
              options: GEM_TX_TYPES.map((t) => ({ label: t, value: t })),
            },
          ]}
          onClear={() => setTypeFilter("")}
        />
      }
      columns={[
        { key: "date", label: "Date", sortable: true },
        { key: "organization", label: "Organization", sortable: true, searchable: true },
        { key: "type", label: "Type", sortable: true },
        { key: "amount", label: "Amount", sortable: true },
        { key: "balanceAfter", label: "Balance After", sortable: true },
        { key: "reason", label: "Reason", sortable: false, searchable: true },
        { key: "performedBy", label: "By", sortable: true },
      ]}
      rows={filtered.map((t) => ({
        id: t.id,
        values: {
          date: t.createdAt.toISOString(),
          organization: t.organization,
          type: t.rewardName || t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          reason: t.reason || "-",
          performedBy: t.performedBy || "-",
        },
        cells: [
          <span key="date" className="text-zinc-300">
            {new Intl.DateTimeFormat(DEFAULT_LOCALE, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(t.createdAt)}
          </span>,
          <span key="organization">{t.organization}</span>,
          <span key="type" className="flex items-center gap-1">
            {t.rewardName && <Gift size={14} className="text-purple-400" />}
            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[t.type] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
              {t.rewardName || t.type}
            </span>
          </span>,
          <span key="amount" className={t.amount > 0 ? "font-medium text-green-400" : "font-medium text-red-400"}>
            {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
          </span>,
          <span key="balanceAfter" className="font-mono text-sm">{t.balanceAfter.toLocaleString()}</span>,
          <span key="reason" className="text-sm text-zinc-400">{t.reason || "-"}</span>,
          <span key="performedBy" className="text-sm text-zinc-500">{t.performedBy || "-"}</span>,
        ],
      }))}
      pageSize={15}
      searchPlaceholder="Search by organization or reason..."
      emptyMessage="No transactions yet."
    />
  );
}
