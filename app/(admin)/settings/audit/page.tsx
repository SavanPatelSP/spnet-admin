"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Filter, List, LayoutList, ChevronDown, ChevronUp, X, RefreshCw, ClipboardList, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { SeverityIndicator } from "@/components/audit/SeverityIndicator";
import { AuditTimeline } from "@/components/audit/AuditTimeline";
import { EventDetailsDrawer } from "@/components/audit/EventDetailsDrawer";
import { cn, formatDateTime } from "@/lib/shared";
import { API_ROUTES } from "@/lib/constants";

interface AuditEvent {
  id: string;
  action: string;
  severity: string;
  entityType: string | null;
  entityId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditResponse {
  success: boolean;
  data: {
    events: AuditEvent[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const ACTION_TYPES = [
  "LICENSE_CREATED", "LICENSE_UPDATED", "LICENSE_DELETED", "LICENSE_SUSPENDED",
  "DEVICE_REVOKED", "LOGIN_SUCCESS", "LOGIN_FAILURE", "PERMISSION_DENIED",
  "MFA_ENABLED", "MFA_DISABLED", "PASSWORD_CHANGED", "ROLE_CREATED",
  "PREMIUM_GRANTED", "PREMIUM_REVOKED", "COINS_ADDED", "GEMS_GRANTED",
];

const SEVERITIES = ["Critical", "High", "Medium", "Low"];

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AuditSettingsPage() {
  const router = useRouter();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchEvents = useCallback(async (p: number, ps: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("pageSize", String(ps));
      if (actionFilter) params.set("action", actionFilter);
      if (severityFilter) params.set("severity", severityFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo) params.set("to", new Date(dateTo).toISOString());
      if (search) params.set("search", search);

      const res = await fetch(`${API_ROUTES.AUDIT.LIST}?${params}`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      const json: AuditResponse = await res.json();
      if (json.success) {
        setEvents(json.data.events);
        setTotal(json.data.total);
      } else {
        throw new Error("API returned unsuccessful");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [actionFilter, severityFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchEvents(page, pageSize);
  }, [fetchEvents, page, pageSize]);

  const todayCount = useMemo(
    () => events.filter((e) => new Date(e.createdAt).toDateString() === new Date().toDateString()).length,
    [events],
  );

  const criticalCount = useMemo(() => events.filter((e) => e.severity === "Critical").length, [events]);
  const highCount = useMemo(() => events.filter((e) => e.severity === "High").length, [events]);

  const hasActiveFilters = actionFilter || severityFilter || dateFrom || dateTo || search;

  function clearFilters() {
    setSearch("");
    setActionFilter("");
    setSeverityFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const columns = useMemo(() => [
    {
      key: "action",
      label: "Action",
      sortable: true,
      searchable: true,
      className: "w-48",
    },
    {
      key: "severity",
      label: "Severity",
      sortable: true,
      className: "w-24",
    },
    {
      key: "actor",
      label: "Actor",
      sortable: true,
      searchable: true,
      className: "w-40",
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      searchable: true,
      className: "min-w-[200px]",
    },
    {
      key: "entity",
      label: "Entity",
      sortable: true,
      className: "w-32",
    },
    {
      key: "time",
      label: "Time",
      sortable: true,
      className: "w-32 text-right",
    },
  ], []);

  const rows = useMemo(() => events.map((event) => ({
    id: event.id,
    values: {
      action: event.action,
      severity: event.severity,
      actor: event.actorName || event.actorEmail || "System",
      description: event.description || event.action.replace(/_/g, " "),
      entity: event.entityType || "-",
      time: event.createdAt,
    },
    cells: [
      <span key="action" className="inline-flex items-center gap-1.5">
        <span className="text-xs font-medium text-zinc-200">{event.action.replace(/_/g, " ")}</span>
      </span>,
      <SeverityIndicator key="severity" severity={event.severity} size="sm" />,
      <span key="actor" className="text-sm text-zinc-300">{event.actorName || event.actorEmail || "System"}</span>,
      <span key="desc" className="max-w-xs truncate text-sm text-zinc-400">{event.description || event.action.replace(/_/g, " ")}</span>,
      <span key="entity" className="text-sm text-zinc-400">{event.entityType || "-"}</span>,
      <span key="time" className="text-xs text-zinc-500">{formatRelativeTime(event.createdAt)}</span>,
    ],
  })), [events]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Configuration"
        description="Retention policies, exports, alerts and compliance settings."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <ClipboardList size={14} className="text-blue-400" />
          <span>Today: <strong className="text-zinc-200">{todayCount}</strong></span>
        </div>
        <span className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <AlertTriangle size={14} className="text-red-400" />
          <span>Critical: <strong className="text-red-400">{criticalCount}</strong></span>
        </div>
        <span className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <AlertCircle size={14} className="text-orange-400" />
          <span>High: <strong className="text-orange-400">{highCount}</strong></span>
        </div>
        <span className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Info size={14} className="text-yellow-400" />
          <span>Total: <strong className="text-zinc-200">{total.toLocaleString()}</strong></span>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="space-y-3 border-b border-zinc-800 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search actor, email, description..."
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/50 py-2 pl-10 pr-4 text-sm outline-none focus:border-zinc-500 sm:w-80"
                aria-label="Search audit logs"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition-colors",
                  hasActiveFilters
                    ? "border-blue-600/50 bg-blue-500/10 text-blue-400"
                    : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}
              >
                <Filter size={14} />
                Filters
                {hasActiveFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white font-bold">!</span>}
                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <div className="flex overflow-hidden rounded-xl border border-zinc-700">
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "px-3 py-1.5 text-sm transition-colors",
                    viewMode === "table" ? "bg-zinc-700 text-zinc-200" : "bg-transparent text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={cn(
                    "px-3 py-1.5 text-sm transition-colors",
                    viewMode === "timeline" ? "bg-zinc-700 text-zinc-200" : "bg-transparent text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  <LayoutList size={14} />
                </button>
              </div>
              <button
                onClick={() => { setPage(1); fetchEvents(1, pageSize); }}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-400 outline-none"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
              <span className="text-sm text-zinc-500">{total} result{total !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-zinc-500"
                >
                  <option value="">All Actions</option>
                  {ACTION_TYPES.map((a) => (
                    <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-zinc-500"
                >
                  <option value="">All Severities</option>
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-zinc-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-zinc-500"
                />
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle size={36} className="text-red-400" />
            <p className="mt-4 text-sm text-zinc-500">{error}</p>
            <button
              onClick={() => fetchEvents(page, pageSize)}
              className="mt-4 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              Retry
            </button>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead className="border-b border-zinc-800 bg-zinc-950/40">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-zinc-400">Action</th>
                  <th className="p-4 text-left text-sm font-medium text-zinc-400">Severity</th>
                  <th className="p-4 text-left text-sm font-medium text-zinc-400">Actor</th>
                  <th className="p-4 text-left text-sm font-medium text-zinc-400">Description</th>
                  <th className="p-4 text-left text-sm font-medium text-zinc-400">Entity</th>
                  <th className="p-4 text-right text-sm font-medium text-zinc-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="cursor-pointer border-b border-zinc-800 transition-colors hover:bg-zinc-800/30"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedEvent(event); } }}
                  >
                    <td className="p-4">
                      <span className="text-sm font-medium text-zinc-200">{event.action.replace(/_/g, " ")}</span>
                    </td>
                    <td className="p-4">
                      <SeverityIndicator severity={event.severity} size="sm" />
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-zinc-300">{event.actorName || event.actorEmail || "System"}</span>
                    </td>
                    <td className="max-w-xs truncate p-4">
                      <span className="text-sm text-zinc-400">{event.description || event.action.replace(/_/g, " ")}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-zinc-400">{event.entityType || "-"}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs text-zinc-500">{formatRelativeTime(event.createdAt)}</span>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10">
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ClipboardList size={32} className="text-zinc-600" />
                        <p className="mt-2 text-sm text-zinc-500">No audit events match your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <AuditTimeline events={events} onEventClick={setSelectedEvent} />
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-sm text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <EventDetailsDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
