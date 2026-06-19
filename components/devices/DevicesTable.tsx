"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { downloadCSV } from "@/lib/export";
import { API_ROUTES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/shared";
import { useToast } from "@/components/ui/Toast";
import {
  Ban, ShieldCheck, TrendingUp, TrendingDown, RotateCcw, History, Trash2, MoreHorizontal,
  RefreshCw, Globe, Loader2, X, Power, PowerOff, PauseCircle, Smartphone,
} from "lucide-react";
import { usePolling } from "@/lib/hooks/usePolling";
import { GeoEnrichmentButton } from "@/components/devices/GeoEnrichmentButton";
import { getCountryName } from "@/lib/geo";

type DeviceStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLACKLISTED";

interface DeviceRow {
  id: string;
  deviceName: string | null;
  deviceId: string;
  ipAddress: string | null;
  trustScore: number;
  os: string | null;
  browser: string | null;
  country: string | null;
  status: DeviceStatus;
  licenseId: string;
  licenseKey: string;
  organization: string;
  lastSeenAt: Date | null;
  createdAt: Date;
}

interface DevicesTableProps {
  devices: DeviceRow[];
  autoRefresh?: boolean;
}

interface ActivationResponse {
  id: string;
  deviceName: string | null;
  deviceId: string;
  ipAddress: string | null;
  trustScore: number;
  os: string | null;
  browser: string | null;
  country: string | null;
  status: string;
  license: { id: string; key: string; organization: string };
  lastSeenAt: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<DeviceStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
  BLACKLISTED: "Blacklisted",
};

const STATUS_STYLES: Record<DeviceStatus, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  INACTIVE: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  SUSPENDED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  BLACKLISTED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function DevicesTable({ devices: initialDevices, autoRefresh = true }: DevicesTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [devices, setDevices] = useState<DeviceRow[]>(initialDevices);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [orgFilter, setOrgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "">("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [trustTarget, setTrustTarget] = useState<string | null>(null);
  const [trustScoreInput, setTrustScoreInput] = useState("50");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [autoRefreshOn, setAutoRefreshOn] = useState(autoRefresh);
  const [trustHistoryTarget, setTrustHistoryTarget] = useState<string | null>(null);
  const [trustHistoryData, setTrustHistoryData] = useState<{ previousScore: number | null; newScore: number | null; changedBy: string; createdAt: string }[]>([]);
  const [trustHistoryLoading, setTrustHistoryLoading] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  useEffect(() => {
    if (!openDropdown) return;
    function handleClick() {
      setOpenDropdown(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDropdown]);

  const fetchDevices = useCallback(async () => {
    try {
      const params = new URLSearchParams({ pageSize: "100" });
      if (statusFilter) params.set("status", statusFilter.toLowerCase());
      const res = await fetch(`${API_ROUTES.DEVICES.LIST}?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success) return;
      const mapped: DeviceRow[] = json.data.activations.map((a: ActivationResponse) => ({
        id: a.id,
        deviceName: a.deviceName,
        deviceId: a.deviceId,
        ipAddress: a.ipAddress,
        trustScore: a.trustScore,
        os: a.os,
        browser: a.browser,
        country: a.country,
        status: a.status as DeviceStatus,
        licenseId: a.license.id,
        licenseKey: a.license.key,
        organization: a.license.organization,
        lastSeenAt: a.lastSeenAt ? new Date(a.lastSeenAt) : null,
        createdAt: new Date(a.createdAt),
      }));
      setDevices(mapped);
    } catch {
      // silent
    }
  }, [statusFilter]);

  usePolling(fetchDevices, 30000, autoRefreshOn);

  const orgs = useMemo(
    () => [...new Set(devices.map((d) => d.organization))].sort(),
    [devices]
  );

  const filtered = useMemo(() => {
    let result = devices;
    if (orgFilter) result = result.filter((d) => d.organization === orgFilter);
    if (statusFilter) result = result.filter((d) => d.status === statusFilter);
    return result;
  }, [devices, orgFilter, statusFilter]);

  function handleExportCSV() {
    const headers = ["Device Name", "Device ID", "IP Address", "OS", "Browser", "Status", "Last Seen", "Trust Score", "License Key", "Organization", "Activated"];
    const rows = filtered.map((d) => [
      d.deviceName || "Unknown",
      d.deviceId,
      d.ipAddress || "",
      d.os || "",
      d.browser || "",
      STATUS_LABELS[d.status],
      d.lastSeenAt ? formatDate(d.lastSeenAt) : "",
      String(d.trustScore),
      d.licenseKey,
      d.organization,
      formatDate(d.createdAt),
    ]);
    downloadCSV("devices", headers, rows);
  }

  async function bulkRevoke() {
    if (!confirm(`Revoke ${selectedIds.size} device activation${selectedIds.size > 1 ? "s" : ""}?`)) return;
    for (const id of selectedIds) {
      await fetch(API_ROUTES.DEVICES.REVOKE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    }
    setSelectedIds(new Set());
    router.refresh();
    fetchDevices();
    toast(`Revoked ${selectedIds.size} device activation(s)`, "success");
  }

  async function handleStatusChange(id: string, targetStatus: DeviceStatus) {
    setActionLoadingId(id);
    const routeMap: Record<DeviceStatus, string> = {
      ACTIVE: API_ROUTES.DEVICES.ACTIVATE,
      INACTIVE: API_ROUTES.DEVICES.DEACTIVATE,
      SUSPENDED: API_ROUTES.DEVICES.SUSPEND,
      BLACKLISTED: API_ROUTES.DEVICES.BLACKLIST,
    };
    try {
      const res = await fetch(routeMap[targetStatus], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || `Failed to ${targetStatus.toLowerCase()} device`, "error");
        return;
      }
      toast(`Device ${STATUS_LABELS[targetStatus].toLowerCase()}`, "success");
      setOpenDropdown(null);
      router.refresh();
      fetchDevices();
    } catch {
      toast(`Failed to ${targetStatus.toLowerCase()} device`, "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleWhitelist(id: string) {
    setActionLoadingId(id);
    try {
      const res = await fetch(API_ROUTES.DEVICES.WHITELIST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to whitelist device", "error");
        return;
      }
      toast("Device whitelisted", "success");
      setOpenDropdown(null);
      router.refresh();
      fetchDevices();
    } catch {
      toast("Failed to whitelist device", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(API_ROUTES.DEVICES.REVOKE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: revokeTarget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke device");
      setRevokeTarget(null);
      setOpenDropdown(null);
      router.refresh();
      fetchDevices();
      toast("Device revoked", "success");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to revoke device");
      toast(e instanceof Error ? e.message : "Failed to revoke device", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateTrust() {
    if (!trustTarget) return;
    const score = parseInt(trustScoreInput, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      setActionError("Trust score must be between 0 and 100");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(API_ROUTES.DEVICES.UPDATE_TRUST, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trustTarget, trustScore: score }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update trust score");
      setTrustTarget(null);
      setOpenDropdown(null);
      router.refresh();
      fetchDevices();
      toast(`Trust score updated to ${score}`, "success");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update trust score");
      toast(e instanceof Error ? e.message : "Failed to update trust score", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTrustIncrease(id: string) {
    setActionLoadingId(id);
    try {
      const res = await fetch(API_ROUTES.DEVICES.TRUST_INCREASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to increase trust score", "error");
        return;
      }
      toast(`Trust score increased to ${data.data?.newTrustScore ?? ""}`, "success");
      setOpenDropdown(null);
      router.refresh();
      fetchDevices();
    } catch {
      toast("Failed to increase trust score", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleTrustDecrease(id: string) {
    setActionLoadingId(id);
    try {
      const res = await fetch(API_ROUTES.DEVICES.TRUST_DECREASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to decrease trust score", "error");
        return;
      }
      toast(`Trust score decreased to ${data.data?.newTrustScore ?? ""}`, "success");
      setOpenDropdown(null);
      router.refresh();
      fetchDevices();
    } catch {
      toast("Failed to decrease trust score", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleTrustReset(id: string) {
    if (!confirm("Reset trust score to 50?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(API_ROUTES.DEVICES.TRUST_RESET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to reset trust score", "error");
        return;
      }
      toast("Trust score reset to 50", "success");
      setOpenDropdown(null);
      router.refresh();
      fetchDevices();
    } catch {
      toast("Failed to reset trust score", "error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleTrustHistory(id: string) {
    setTrustHistoryTarget(id);
    setTrustHistoryLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.DEVICES.TRUST_HISTORY}?id=${id}`);
      const json = await res.json();
      if (json.success) {
        setTrustHistoryData(json.data);
      }
    } catch {
      setTrustHistoryData([]);
    } finally {
      setTrustHistoryLoading(false);
    }
  }

  async function handleEnrichGeo(id: string, ipAddress: string) {
    setEnrichingId(id);
    try {
      const res = await fetch(API_ROUTES.DEVICES.ENRICH_GEO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ipAddress }),
      });
      const json = await res.json();
      if (json.success) {
        router.refresh();
        fetchDevices();
        toast("Geo data enriched", "success");
      }
    } catch {
      toast("Failed to enrich geo data", "error");
    } finally {
      setEnrichingId(null);
    }
  }

  const ActionButton = ({
    onClick, label, icon: Icon, variant = "zinc", loading,
  }: {
    onClick: () => void; label: string; icon: React.ElementType; variant?: "green" | "yellow" | "red" | "zinc" | "blue"; loading?: boolean;
  }) => {
    const variantStyles = {
      green: "text-green-400 hover:bg-green-500/10",
      yellow: "text-yellow-400 hover:bg-yellow-500/10",
      red: "text-red-400 hover:bg-red-500/10",
      zinc: "text-zinc-300 hover:bg-zinc-800",
      blue: "text-blue-400 hover:bg-blue-500/10",
    };
    return (
      <button
        onClick={onClick}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${variantStyles[variant]}`}
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
        {label}
      </button>
    );
  };

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          exportable
          onExport={handleExportCSV}
          exportActions={
            <>
              <GeoEnrichmentButton
                onComplete={() => { router.refresh(); fetchDevices(); }}
                disabled={devices.every((d) => d.country !== null)}
              />
              <button
                onClick={() => setAutoRefreshOn((p) => !p)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Toggle auto-refresh"
              >
                <RefreshCw size={14} className={autoRefreshOn ? "animate-spin" : ""} />
                Auto
              </button>
            </>
          }
          filters={
            <FilterBar
              filters={[
                {
                  key: "organization",
                  label: "All Organizations",
                  value: orgFilter,
                  onChange: setOrgFilter,
                  options: orgs.map((o) => ({ label: o, value: o })),
                },
                {
                  key: "status",
                  label: "All Statuses",
                  value: statusFilter,
                  onChange: (v) => setStatusFilter(v as DeviceStatus | ""),
                  options: [
                    { label: "Active", value: "ACTIVE" },
                    { label: "Inactive", value: "INACTIVE" },
                    { label: "Suspended", value: "SUSPENDED" },
                    { label: "Blacklisted", value: "BLACKLISTED" },
                  ],
                },
              ]}
              onClear={() => { setOrgFilter(""); setStatusFilter(""); }}
            />
          }
          bulkActions={
            selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={bulkRevoke} className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
                  Revoke {selectedIds.size}
                </button>
              </div>
            )
          }
          columns={[
            { key: "deviceName", label: "Device", sortable: true, searchable: true },
            { key: "deviceId", label: "Device ID", sortable: true, searchable: true, className: "hidden md:table-cell" },
            { key: "ipAddress", label: "IP", sortable: true, className: "hidden lg:table-cell" },
            { key: "os", label: "OS", sortable: true, className: "hidden sm:table-cell" },
            { key: "browser", label: "Browser", sortable: true, className: "hidden xl:table-cell" },
            { key: "country", label: "Country", sortable: true, className: "hidden lg:table-cell" },
            { key: "lastSeenAt", label: "Last Seen", sortable: true, className: "hidden md:table-cell" },
            { key: "trustScore", label: "Trust", sortable: true, className: "hidden sm:table-cell" },
            { key: "status", label: "Status", sortable: true },
            { key: "license", label: "License", sortable: true, searchable: true, className: "hidden lg:table-cell" },
            { key: "organization", label: "Organization", sortable: true, searchable: true, className: "hidden xl:table-cell" },
            { key: "createdAt", label: "Activated", sortable: true, className: "hidden md:table-cell" },
            { key: "actions", label: "Actions", className: "w-20" },
          ]}
          rows={filtered.map((d) => ({
            id: d.id,
            values: {
              deviceName: d.deviceName || "Unknown Device",
              deviceId: d.deviceId,
              ipAddress: d.ipAddress || "",
              os: d.os || "",
              browser: d.browser || "",
              country: getCountryName(d.country),
              lastSeenAt: d.lastSeenAt ? d.lastSeenAt.toISOString() : "",
              trustScore: String(d.trustScore),
              status: STATUS_LABELS[d.status],
              license: d.licenseKey,
              organization: d.organization,
              createdAt: d.createdAt.toISOString(),
              actions: "",
            },
            cells: [
              <Link key="deviceName" href={`/devices/${d.id}`} className="font-medium text-blue-400 hover:underline">
                {d.deviceName || "Unknown Device"}
              </Link>,
              <span key="deviceId" className="font-mono text-xs text-zinc-400 hidden md:inline">{d.deviceId}</span>,
              <span key="ipAddress" className="hidden lg:table-cell">{d.ipAddress || "-"}</span>,
              <span key="os" className="hidden sm:table-cell">{d.os || "-"}</span>,
              <span key="browser" className="hidden xl:table-cell">{d.browser || "-"}</span>,
              <span key="country" className="group relative hidden lg:table-cell">
                {d.country ? (
                  <span title={d.ipAddress || undefined}>{getCountryName(d.country)}</span>
                ) : d.ipAddress ? (
                  <button
                    onClick={() => handleEnrichGeo(d.id, d.ipAddress!)}
                    disabled={enrichingId === d.id}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    {enrichingId === d.id ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                    Resolve
                  </button>
                ) : (
                  <span className="text-zinc-500">-</span>
                )}
              </span>,
              <span key="lastSeenAt" className="hidden md:table-cell">{d.lastSeenAt ? formatDateTime(d.lastSeenAt) : "-"}</span>,
              <span key="trustScore" className={`hidden sm:table-cell font-medium ${d.trustScore >= 60 ? "text-green-400" : d.trustScore >= 30 ? "text-yellow-400" : "text-red-400"}`}>
                {d.trustScore}
              </span>,
              <span key="status">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[d.status]}`}>
                  {STATUS_LABELS[d.status]}
                </span>
              </span>,
              <Link key="license" href={`/licenses/${d.licenseId}`} className="hidden lg:table-cell font-mono text-xs text-blue-400 hover:underline">
                {d.licenseKey}
              </Link>,
              <span key="organization" className="hidden xl:table-cell">{d.organization}</span>,
              <span key="createdAt" className="hidden md:table-cell">{formatDate(d.createdAt)}</span>,
              <div key="actions" className="relative" onMouseDown={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === d.id ? null : d.id); }}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  aria-label="Device actions"
                >
                  <MoreHorizontal size={16} />
                </button>
                {openDropdown === d.id && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                    {d.status === "BLACKLISTED" ? (
                      <button
                        onClick={() => handleWhitelist(d.id)}
                        disabled={actionLoadingId === d.id}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                      >
                        <ShieldCheck size={14} className="text-green-400" />
                        Whitelist Device
                      </button>
                    ) : (
                      <>
                        {d.status !== "ACTIVE" && (
                          <button
                            onClick={() => handleStatusChange(d.id, "ACTIVE")}
                            disabled={actionLoadingId === d.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                          >
                            <Power size={14} className="text-green-400" />
                            Activate
                          </button>
                        )}
                        {d.status !== "INACTIVE" && (
                          <button
                            onClick={() => handleStatusChange(d.id, "INACTIVE")}
                            disabled={actionLoadingId === d.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                          >
                            <PowerOff size={14} className="text-zinc-400" />
                            Deactivate
                          </button>
                        )}
                        {d.status !== "SUSPENDED" && (
                          <button
                            onClick={() => handleStatusChange(d.id, "SUSPENDED")}
                            disabled={actionLoadingId === d.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                          >
                            <PauseCircle size={14} className="text-yellow-400" />
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(d.id, "BLACKLISTED")}
                          disabled={actionLoadingId === d.id}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-zinc-800"
                        >
                          <Ban size={14} />
                          Blacklist
                        </button>
                      </>
                    )}
                    <div className="my-1 border-t border-zinc-700" />
                    <button
                      onClick={() => { setTrustTarget(d.id); setTrustScoreInput(String(d.trustScore)); setActionError(""); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <TrendingUp size={14} className="text-blue-400" />
                      Update Trust
                    </button>
                    <button
                      onClick={() => handleTrustIncrease(d.id)}
                      disabled={actionLoadingId === d.id}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <TrendingUp size={14} className="text-green-400" />
                      Increase Trust (+10)
                    </button>
                    <button
                      onClick={() => handleTrustDecrease(d.id)}
                      disabled={actionLoadingId === d.id}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <TrendingDown size={14} className="text-red-400" />
                      Decrease Trust (-10)
                    </button>
                    <button
                      onClick={() => handleTrustReset(d.id)}
                      disabled={actionLoadingId === d.id}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <RotateCcw size={14} className="text-yellow-400" />
                      Reset Trust (50)
                    </button>
                    <div className="my-1 border-t border-zinc-700" />
                    <button
                      onClick={() => handleTrustHistory(d.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <History size={14} className="text-blue-400" />
                      Trust History
                    </button>
                    <button
                      onClick={() => { setRevokeTarget(d.id); setActionError(""); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-zinc-800"
                    >
                      <Trash2 size={14} />
                      Revoke Device
                    </button>
                  </div>
                )}
              </div>,
            ],
          }))}
          searchPlaceholder="Search by device name, ID, or license..."
          emptyMessage="No activated devices found."
        />
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-4">
        {filtered.map((d) => (
          <div key={d.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
                  <Smartphone size={20} className="text-zinc-400" />
                </div>
                <div>
                  <Link href={`/devices/${d.id}`} className="font-medium text-blue-400 hover:underline">
                    {d.deviceName || "Unknown Device"}
                  </Link>
                  <p className="text-xs text-zinc-500">{d.licenseKey}</p>
                </div>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[d.status]}`}>
                {STATUS_LABELS[d.status]}
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="block text-zinc-500">Browser</span>
                <span className="text-zinc-300">{d.browser || "-"}</span>
              </div>
              <div>
                <span className="block text-zinc-500">OS</span>
                <span className="text-zinc-300">{d.os || "-"}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Last Seen</span>
                <span className="text-zinc-300">{d.lastSeenAt ? formatDateTime(d.lastSeenAt) : "-"}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Trust Score</span>
                <span className={`font-medium ${d.trustScore >= 60 ? "text-green-400" : d.trustScore >= 30 ? "text-yellow-400" : "text-red-400"}`}>
                  {d.trustScore}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Country</span>
                <span className="text-zinc-300">{d.country ? getCountryName(d.country) : (d.ipAddress ? (
                  <button
                    onClick={() => handleEnrichGeo(d.id, d.ipAddress!)}
                    disabled={enrichingId === d.id}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    {enrichingId === d.id ? <Loader2 size={10} className="animate-spin" /> : <Globe size={10} />}
                    Resolve
                  </button>
                ) : "-")}</span>
              </div>
              <div>
                <span className="block text-zinc-500">IP</span>
                <span className="text-zinc-300">{d.ipAddress || "-"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {d.status !== "ACTIVE" && (
                <ActionButton onClick={() => handleStatusChange(d.id, "ACTIVE")} label="Activate" icon={Power} variant="green" loading={actionLoadingId === d.id} />
              )}
              {d.status !== "INACTIVE" && (
                <ActionButton onClick={() => handleStatusChange(d.id, "INACTIVE")} label="Deactivate" icon={PowerOff} variant="zinc" loading={actionLoadingId === d.id} />
              )}
              {d.status !== "SUSPENDED" && (
                <ActionButton onClick={() => handleStatusChange(d.id, "SUSPENDED")} label="Suspend" icon={PauseCircle} variant="yellow" loading={actionLoadingId === d.id} />
              )}
              <ActionButton onClick={() => handleTrustIncrease(d.id)} label="Trust +" icon={TrendingUp} variant="green" loading={actionLoadingId === d.id} />
              <ActionButton onClick={() => handleTrustDecrease(d.id)} label="Trust -" icon={TrendingDown} variant="red" loading={actionLoadingId === d.id} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-sm text-zinc-500">
            No activated devices found.
          </div>
        )}
      </div>

      <ConfirmDialog
        open={revokeTarget !== null}
        onClose={() => { setRevokeTarget(null); setActionError(""); }}
        onConfirm={handleRevoke}
        title="Revoke Device"
        description="This will remove the device activation. The device will no longer be able to use this license."
        confirmLabel="Revoke Device"
        variant="danger"
        loading={actionLoading}
        error={actionError}
      />

      <ConfirmDialog
        open={trustTarget !== null}
        onClose={() => { setTrustTarget(null); setActionError(""); }}
        onConfirm={handleUpdateTrust}
        title="Update Trust Score"
        confirmLabel="Update"
        variant="primary"
        loading={actionLoading}
        error={actionError}
        customContent={
          <div className="py-4">
            <label className="mb-2 block text-sm text-zinc-400">Trust Score (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={trustScoreInput}
              onChange={(e) => setTrustScoreInput(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-center text-lg font-bold text-white outline-none focus:border-zinc-500"
            />
          </div>
        }
      />

      {trustHistoryTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setTrustHistoryTarget(null)}>
          <div className="mx-4 w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Trust Score History</h3>
              <button onClick={() => setTrustHistoryTarget(null)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
                <X size={16} />
              </button>
            </div>
            {trustHistoryLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-zinc-400" />
              </div>
            ) : trustHistoryData.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No trust score changes recorded yet.</p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {trustHistoryData.map((entry, i) => (
                  <div key={i} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">
                        {entry.previousScore !== null && entry.newScore !== null ? (
                          <>
                            <span className={entry.newScore > entry.previousScore ? "text-green-400" : "text-red-400"}>
                              {entry.previousScore} → {entry.newScore}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-400">Score changed</span>
                        )}
                      </span>
                      <span className="text-xs text-zinc-500">{entry.changedBy}</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
