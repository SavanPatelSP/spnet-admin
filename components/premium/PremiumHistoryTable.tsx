"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { downloadCSV } from "@/lib/export";
import { PREMIUM_ACTIONS } from "@/lib/constants";

interface HistoryRow {
  id: string;
  action: string;
  organization: string;
  plan: string;
  grantedBy: string | null;
  createdAt: Date;
  durationDays: number | null;
}

const premiumActionLabels: Record<string, string> = {
  GRANTED: "Granted",
  EXTENDED: "Extended",
  PLAN_CHANGED: "Plan Changed",
  REVOKED: "Revoked",
  CANCELLED: "Cancelled",
  RENEWED: "Renewed",
  DOWNGRADED: "Downgraded",
  UPGRADED: "Upgraded",
  CONVERTED_TO_LIFETIME: "Converted to Lifetime",
  CONVERTED_TO_CUSTOM: "Converted to Custom",
  PREMIUM_REQUEST_SUBMITTED: "Request Submitted",
  PREMIUM_REQUEST_APPROVED: "Request Approved",
  PREMIUM_REQUEST_REJECTED: "Request Rejected",
  PREMIUM_REQUEST_MODIFIED: "Request Modified",
  PREMIUM_GRANTED_FROM_REQUEST: "Granted from Request",
  PREMIUM_CONVERTED_TO_CUSTOM: "Converted to Custom",
};

export function PremiumHistoryTable({ history }: { history: HistoryRow[] }) {
  const [actionFilter, setActionFilter] = useState("");

  const filtered = useMemo(() => {
    if (!actionFilter) return history;
    return history.filter((h) => h.action === actionFilter);
  }, [history, actionFilter]);

  function handleExportCSV() {
    const headers = ["Action", "Organization", "Plan", "Granted By", "Date", "Duration"];
    const rows = filtered.map((h) => [
      premiumActionLabels[h.action] || h.action,
      h.organization,
      h.plan,
      h.grantedBy || "-",
      new Date(h.createdAt).toISOString(),
      h.durationDays ? `${h.durationDays}d` : "-",
    ]);
    downloadCSV("premium-history", headers, rows);
  }

  return (
    <DataTable
      exportable
      onExport={handleExportCSV}
      filters={
        <FilterBar
          filters={[
            {
              key: "action", label: "All Actions", value: actionFilter, onChange: setActionFilter,
              options: PREMIUM_ACTIONS.map((a) => ({ label: premiumActionLabels[a] || a, value: a })),
            },
          ]}
          onClear={() => setActionFilter("")}
        />
      }
      columns={[
        { key: "action", label: "Action", sortable: true },
        { key: "organization", label: "Organization", sortable: true, searchable: true },
        { key: "plan", label: "Plan", sortable: true },
        { key: "grantedBy", label: "Granted By", sortable: true },
        { key: "date", label: "Date", sortable: true },
        { key: "durationDays", label: "Duration", sortable: true },
      ]}
      rows={filtered.map((h) => ({
        id: h.id,
        values: {
          action: premiumActionLabels[h.action] || h.action,
          organization: h.organization,
          plan: h.plan,
          grantedBy: h.grantedBy || "-",
          date: h.createdAt.toISOString(),
          durationDays: h.durationDays ? `${h.durationDays}d` : "-",
        },
        cells: [
          <span key="action"><StatusBadge status={h.action} /></span>,
          <span key="organization">{h.organization}</span>,
          <span key="plan" className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium">{h.plan}</span>,
          <span key="grantedBy">{h.grantedBy || "-"}</span>,
          <span key="date" className="text-zinc-300">
            {(() => {
              const d = new Date(h.createdAt);
              const dd = String(d.getDate()).padStart(2, "0");
              const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
              const yyyy = d.getFullYear();
              const hh = String(d.getHours()).padStart(2, "0");
              const min = String(d.getMinutes()).padStart(2, "0");
              return `${dd} ${mm} ${yyyy}, ${hh}:${min}`;
            })()}
          </span>,
          <span key="durationDays">{h.durationDays ? `${h.durationDays}d` : "-"}</span>,
        ],
      }))}
      pageSize={10}
      searchPlaceholder="Search history by organization..."
      emptyMessage="No premium history yet."
    />
  );
}
