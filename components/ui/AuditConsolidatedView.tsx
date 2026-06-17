"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { ActionButton } from "@/components/ui/ActionButton";
import { downloadCSV } from "@/lib/export";
import { RefreshCw } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  actorName: string | null;
  actorEmail: string | null;
  organization: string | null;
  description: string | null;
  createdAt: string;
}

const ACTION_OPTIONS = [
  { label: "License Created", value: "LICENSE_CREATED" },
  { label: "License Updated", value: "LICENSE_UPDATED" },
  { label: "License Deleted", value: "LICENSE_DELETED" },
  { label: "Device Revoked", value: "DEVICE_REVOKED" },
  { label: "Role Updated", value: "ROLE_PERMISSIONS_UPDATED" },
  { label: "Member Created", value: "TEAM_MEMBER_CREATED" },
  { label: "Member Suspended", value: "TEAM_MEMBER_SUSPENDED" },
  { label: "Login Success", value: "LOGIN_SUCCESS" },
  { label: "Login Failure", value: "LOGIN_FAILURE" },
];

const DATE_RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

export default function AuditConsolidatedView() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [actorSearch, setActorSearch] = useState("");
  const [orgSearch, setOrgSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set("action", actionFilter);
      if (dateRange) params.set("days", dateRange);
      if (actorSearch) params.set("actor", actorSearch);
      if (orgSearch) params.set("organization", orgSearch);
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, dateRange, actorSearch, orgSearch]);

  useEffect(() => {
    const t = setTimeout(() => fetchLogs(), 0);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    let list = entries;
    if (actorSearch) {
      const q = actorSearch.toLowerCase();
      list = list.filter(
        (e) =>
          (e.actorName && e.actorName.toLowerCase().includes(q)) ||
          (e.actorEmail && e.actorEmail.toLowerCase().includes(q))
      );
    }
    if (orgSearch) {
      const q = orgSearch.toLowerCase();
      list = list.filter((e) => e.organization && e.organization.toLowerCase().includes(q));
    }
    return list;
  }, [entries, actorSearch, orgSearch]);

  function handleExportCSV() {
    const headers = ["Action", "Actor", "Email", "Organization", "Description", "Date"];
    const rows = filtered.map((e) => [
      e.action,
      e.actorName || "",
      e.actorEmail || "",
      e.organization || "",
      e.description || "",
      e.createdAt,
    ]);
    downloadCSV("audit-logs", headers, rows);
  }

  function handleClear() {
    setActionFilter("");
    setDateRange("");
    setActorSearch("");
    setOrgSearch("");
  }

  const columns = [
    { key: "action", label: "Action", sortable: true },
    { key: "actorName", label: "Actor", sortable: true },
    { key: "actorEmail", label: "Email", sortable: true, searchable: true },
    { key: "organization", label: "Organization", sortable: true },
    { key: "description", label: "Description" },
    { key: "createdAt", label: "Date", sortable: true },
  ];

  const rows = filtered.map((e) => ({
    id: e.id,
    values: {
      action: e.action,
      actorName: e.actorName || "",
      actorEmail: e.actorEmail || "",
      organization: e.organization || "",
      description: e.description || "",
      createdAt: e.createdAt,
    },
    cells: [
      <span key="action" className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium">{e.action}</span>,
      <span key="actorName" className="font-medium">{e.actorName || "-"}</span>,
      <span key="actorEmail" className="text-sm text-zinc-400">{e.actorEmail || "-"}</span>,
      <span key="organization">{e.organization || "-"}</span>,
      <span key="description" className="max-w-xs truncate text-sm text-zinc-400">{e.description || "-"}</span>,
      <span key="createdAt" className="text-sm text-zinc-400">{new Date(e.createdAt).toLocaleString()}</span>,
    ],
  }));

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-800 bg-red-950/30 p-10 text-center">
        <p className="text-red-400">Failed to load audit logs: {error}</p>
        <ActionButton onClick={fetchLogs} variant="secondary" size="sm">
          Retry
        </ActionButton>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={loading ? [] : rows}
      exportable
      onExport={handleExportCSV}
      searchPlaceholder="Search by email..."
      emptyMessage="No audit entries found."
      filters={
        <div className="flex w-full items-start justify-between gap-4">
          <FilterBar
            filters={[
              {
                key: "action",
                label: "All Actions",
                value: actionFilter,
                onChange: setActionFilter,
                options: ACTION_OPTIONS,
              },
              {
                key: "dateRange",
                label: "All Time",
                value: dateRange,
                onChange: setDateRange,
                options: DATE_RANGE_OPTIONS,
              },
            ]}
            onClear={handleClear}
          />
          <div className="flex items-center gap-2">
            <input
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              placeholder="Filter by actor..."
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500"
            />
            <input
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              placeholder="Filter by org..."
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500"
            />
            <ActionButton onClick={fetchLogs} variant="ghost" size="sm">
              <RefreshCw size={14} />
            </ActionButton>
          </div>
        </div>
      }
    />
  );
}
