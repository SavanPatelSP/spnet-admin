"use client";

import { useState, useMemo, useCallback } from "react";
import { cn, daysUntil, formatDate, calculateUtilization } from "@/lib/shared";
import { EXPIRING_SOON_DAYS, PLANS, LICENSE_STATUSES } from "@/lib/constants";
import { LicenseHealthCard } from "./LicenseHealthCard";
import { ExpirationTimeline } from "./ExpirationTimeline";
import { OrganizationAssociation } from "./OrganizationAssociation";
import { LifecycleVisualization } from "./LifecycleVisualization";
import { BulkOperationsBar } from "./BulkOperationsBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  KeyRound, Activity, AlertTriangle, ShieldCheck, ShieldAlert,
  LayoutGrid, List, Search, X, ChevronDown, ChevronUp,
  BarChart3, PieChart, TrendingUp, Download, RefreshCw,
} from "lucide-react";

interface LicenseData {
  id: string;
  key: string;
  organization: string;
  plan: string;
  status: string;
  maxDevices: number;
  expiresAt: string;
  notes: string | null;
  featureFlags: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  parentLicenseId: string | null;
  createdAt: string;
  updatedAt: string;
  activations: { id: string; createdAt: string }[];
}

interface LicensesPageProps {
  licenses: LicenseData[];
}

type ViewMode = "grid" | "table";
type SortKey = "organization" | "plan" | "status" | "expiresAt" | "usage" | "";
type SortDir = "asc" | "desc";

function healthStatus(l: LicenseData): { label: string; color: string; dot: string } {
  const d = daysUntil(l.expiresAt);
  const usage = l.activations.length;
  const limit = l.maxDevices;
  const ratio = limit > 0 ? usage / limit : 0;
  if (l.status === "EXPIRED" || d < 0) return { label: "Expired", color: "text-red-400", dot: "bg-red-400" };
  if (l.status !== "ACTIVE") return { label: "Critical", color: "text-red-400", dot: "bg-red-400" };
  if (d <= 7 || ratio >= 0.9) return { label: "Critical", color: "text-red-400", dot: "bg-red-400" };
  if (d <= EXPIRING_SOON_DAYS || ratio >= 0.75) return { label: "Warning", color: "text-yellow-400", dot: "bg-yellow-400" };
  return { label: "Healthy", color: "text-green-400", dot: "bg-green-400" };
}

function atRisk(l: LicenseData): boolean {
  const d = daysUntil(l.expiresAt);
  const ratio = l.maxDevices > 0 ? l.activations.length / l.maxDevices : 0;
  return (l.status === "ACTIVE" && (d <= EXPIRING_SOON_DAYS || ratio >= 0.85));
}

export function LicensingDashboard({ licenses }: LicensesPageProps) {
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = licenses;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        l.key.toLowerCase().includes(q) || l.organization.toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((l) => l.status === statusFilter);
    if (planFilter) list = list.filter((l) => l.plan === planFilter);
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "organization") cmp = a.organization.localeCompare(b.organization);
        else if (sortKey === "plan") cmp = a.plan.localeCompare(b.plan);
        else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
        else if (sortKey === "expiresAt") cmp = new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        else if (sortKey === "usage") cmp = a.activations.length - b.activations.length;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [licenses, search, statusFilter, planFilter, sortKey, sortDir]);

  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const expiringSoon = licenses.filter((l) => {
    const d = daysUntil(l.expiresAt);
    return d >= 0 && d <= EXPIRING_SOON_DAYS;
  }).length;
  const expired = licenses.filter((l) => l.status === "EXPIRED" || daysUntil(l.expiresAt) < 0).length;
  const riskCount = licenses.filter(atRisk).length;
  const totalDevices = licenses.reduce((t, l) => t + l.activations.length, 0);
  const totalCapacity = licenses.reduce((t, l) => t + l.maxDevices, 0);
  const utilization = calculateUtilization(totalDevices, totalCapacity);

  const planDist = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of licenses) {
      map[l.plan] = (map[l.plan] || 0) + 1;
    }
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [licenses]);

  const orgGroups = useMemo(() => {
    const map = new Map<string, LicenseData[]>();
    for (const l of licenses) {
      const existing = map.get(l.organization) || [];
      existing.push(l);
      map.set(l.organization, existing);
    }
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      initials: name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      totalLicenses: items.length,
      totalActivations: items.reduce((t, i) => t + i.activations.length, 0),
      licenses: items.map((i) => ({
        id: i.id,
        key: i.key,
        plan: i.plan,
        status: i.status,
        expiresAt: i.expiresAt,
        activationCount: i.activations.length,
        maxDevices: i.maxDevices,
      })),
    }));
  }, [licenses]);

  const selectedLicense = selectedLicenseId ? licenses.find((l) => l.id === selectedLicenseId) : null;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      if (prev.size === filtered.length && filtered.length > 0) return new Set();
      return new Set(filtered.map((l) => l.id));
    });
  }

  function renderSortHeader(label: string, sortValue: SortKey) {
    return (
      <th
        className="cursor-pointer select-none px-4 py-3 text-left text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        onClick={() => toggleSort(sortValue)}
      >
        {label}
        {sortKey === sortValue && (
          <span className="ml-1 text-blue-400">{sortDir === "asc" ? "↑" : "↓"}</span>
        )}
      </th>
    );
  }

  const stats = [
    { title: "Total Licenses", value: licenses.length, icon: KeyRound, color: "blue" as const },
    { title: "Active", value: activeLicenses, icon: Activity, color: "green" as const,
      subtitle: `${licenses.length > 0 ? Math.round((activeLicenses / licenses.length) * 100) : 0}% active` },
    { title: "Expiring Soon", value: expiringSoon, icon: AlertTriangle, color: "yellow" as const,
      subtitle: `Within ${EXPIRING_SOON_DAYS} days` },
    { title: "Expired", value: expired, icon: ShieldCheck, color: "red" as const },
    { title: "At Risk", value: riskCount, icon: ShieldAlert, color: riskCount > 0 ? "yellow" as const : "default" as const,
      subtitle: "High usage or near expiry" },
    { title: "Utilization", value: `${utilization}%`, icon: TrendingUp, color: utilization > 80 ? "yellow" as const : "green" as const,
      subtitle: `${totalDevices}/${totalCapacity} devices` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.title} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">{s.title}</p>
            <p className={`mt-1 text-2xl font-bold ${
              s.color === "green" ? "text-green-400" :
              s.color === "yellow" ? "text-yellow-400" :
              s.color === "red" ? "text-red-400" :
              s.color === "blue" ? "text-blue-400" :
              "text-zinc-100"
            }`}>
              {s.value}
            </p>
            {s.subtitle && <p className="mt-0.5 text-[10px] text-zinc-600">{s.subtitle}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by key or organization..."
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-800/50 py-2 pl-10 pr-4 text-sm outline-none focus:border-zinc-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 md:hidden"
          >
            Filters {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <div className={cn("hidden items-center gap-2 md:flex", showFilters && "flex flex-wrap")}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {LICENSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500"
            >
              <option value="">All Plans</option>
              {(PLANS as readonly string[]).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {(statusFilter || planFilter || search) && (
              <button
                onClick={() => { setStatusFilter(""); setPlanFilter(""); setSearch(""); }}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-zinc-700 p-1">
            <button
              onClick={() => setView("grid")}
              className={cn("rounded-lg p-1.5 transition-colors", view === "grid" ? "bg-blue-500/20 text-blue-400" : "text-zinc-500 hover:text-zinc-300")}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setView("table")}
              className={cn("rounded-lg p-1.5 transition-colors", view === "table" ? "bg-blue-500/20 text-blue-400" : "text-zinc-500 hover:text-zinc-300")}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-5 py-3 md:hidden">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {LICENSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500"
            >
              <option value="">All Plans</option>
              {(PLANS as readonly string[]).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {(statusFilter || planFilter) && (
              <button
                onClick={() => { setStatusFilter(""); setPlanFilter(""); }}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        )}

        <BulkOperationsBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
        />

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No licenses found"
              description={search || statusFilter || planFilter ? "Try adjusting your search or filters." : "No licenses have been created yet."}
              icon={<KeyRound size={32} className="text-zinc-500" />}
              className="border-0 bg-transparent"
            />
          </div>
        ) : view === "grid" ? (
          <>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-600"
                />
                <span className="text-sm text-zinc-400">{selectedIds.size} of {filtered.length} selected</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((l) => (
                <div key={l.id} className="relative">
                  {selectedIds.size > 0 && (
                    <div className="absolute left-3 top-3 z-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(l.id)}
                        onChange={() => toggleSelect(l.id)}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-600"
                      />
                    </div>
                  )}
                  <LicenseHealthCard
                    id={l.id}
                    key={l.key}
                    organization={l.organization}
                    plan={l.plan}
                    status={l.status}
                    usageCount={l.activations.length}
                    usageLimit={l.maxDevices}
                    expiresAt={l.expiresAt}
                    onClick={(id) => setSelectedLicenseId(id)}
                    className={cn(selectedIds.has(l.id) && "ring-2 ring-blue-500/50")}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-600"
                />
                <span className="text-sm text-zinc-400">{selectedIds.size} of {filtered.length} selected</span>
              </div>
            )}
            <table className="w-full">
              <thead className="border-b border-zinc-800 bg-zinc-950/40">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-600"
                    />
                  </th>
                  {renderSortHeader("Organization", "organization")}
                  {renderSortHeader("Plan", "plan")}
                  {renderSortHeader("Status", "status")}
                  {renderSortHeader("Usage", "usage")}
                  {renderSortHeader("Expiry", "expiresAt")}
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Health</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const hs = healthStatus(l);
                  const d = daysUntil(l.expiresAt);
                  const usagePct = l.maxDevices > 0 ? Math.round((l.activations.length / l.maxDevices) * 100) : 0;
                  return (
                    <tr
                      key={l.id}
                      className={cn(
                        "border-b border-zinc-800 transition-colors hover:bg-zinc-800/20",
                        selectedIds.has(l.id) && "bg-blue-500/5",
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(l.id)}
                          onChange={() => toggleSelect(l.id)}
                          className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-zinc-200">{l.organization}</p>
                        <p className="font-mono text-[10px] text-zinc-500">{l.key}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">{l.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-700">
                            <div
                              className={cn("h-full rounded-full", usagePct >= 90 ? "bg-red-500" : usagePct >= 75 ? "bg-yellow-500" : "bg-green-500")}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-400">{l.activations.length}/{l.maxDevices}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs",
                          d < 0 ? "text-red-400" : d <= EXPIRING_SOON_DAYS ? "text-yellow-400" : "text-zinc-300",
                        )}>
                          {formatDate(l.expiresAt)}
                          {d >= 0 && d <= EXPIRING_SOON_DAYS && <span className="ml-1 text-yellow-500">({d}d)</span>}
                          {d < 0 && <span className="ml-1 text-red-500">(expired)</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", hs.dot)} />
                          <span className={cn("text-xs font-medium", hs.color)}>{hs.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
          <span className="text-xs text-zinc-500">{filtered.length} of {licenses.length} licenses</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ExpirationTimeline
          licenses={licenses.map((l) => ({
            id: l.id,
            key: l.key,
            organization: l.organization,
            plan: l.plan,
            status: l.status,
            expiresAt: l.expiresAt,
            usageCount: l.activations.length,
            usageLimit: l.maxDevices,
          }))}
          className="lg:col-span-2"
        />

        {selectedLicense ? (
          <LifecycleVisualization
            createdAt={selectedLicense.createdAt}
            activatedAt={selectedLicense.activations.length > 0 ? selectedLicense.activations[0].createdAt : null}
            expiresAt={selectedLicense.expiresAt}
            status={selectedLicense.status}
          />
        ) : (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-zinc-400" />
              <h2 className="text-lg font-semibold">Plan Distribution</h2>
            </div>
            {planDist.length > 0 ? (
              <div className="space-y-3">
                {planDist.map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                    <span className="text-sm font-medium text-zinc-300">{plan}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-700 sm:w-32">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${(count / licenses.length) * 100}%` }} />
                      </div>
                      <span className="text-sm text-zinc-400">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No plan data</p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OrganizationAssociation groups={orgGroups} />

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-zinc-400" />
            <h2 className="text-lg font-semibold">Analytics Summary</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500">Total Activations</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{totalDevices.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500">Total Capacity</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{totalCapacity.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500">Utilization Rate</p>
              <p className={cn("mt-1 text-2xl font-bold", utilization > 80 ? "text-yellow-400" : "text-green-400")}>{utilization}%</p>
            </div>
            <div className="rounded-xl bg-zinc-800/50 p-4">
              <p className="text-xs text-zinc-500">Activation Success</p>
              <p className="mt-1 text-2xl font-bold text-green-400">
                {totalCapacity > 0 ? Math.round((totalDevices / totalCapacity) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-zinc-800/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-400" />
              <h3 className="text-xs font-semibold text-zinc-400">Activations Over Time</h3>
            </div>
            <div className="flex items-end gap-1" style={{ height: 48 }}>
              {Array.from({ length: 30 }).map((_, i) => {
                const dayCount = licenses.reduce((t, l) => {
                  return t + l.activations.filter((a) => {
                    const d = new Date(a.createdAt);
                    const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
                    return daysAgo === 29 - i;
                  }).length;
                }, 0);
                const maxCount = Math.max(1, ...Array.from({ length: 30 }).map((_, j) => {
                  return licenses.reduce((t, l) => t + l.activations.filter((a) => {
                    const daysAgo = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                    return daysAgo === 29 - j;
                  }).length, 0);
                }));
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${(dayCount / maxCount) * 100}%`,
                      backgroundColor: dayCount > 0 ? "#3b82f6" : "#27272a",
                      minHeight: dayCount > 0 ? 2 : 0,
                    }}
                    title={`Day ${29 - i}: ${dayCount}`}
                  />
                );
              })}
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-zinc-600">
              <span>30d ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
