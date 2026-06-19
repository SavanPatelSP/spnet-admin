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
import { Ban, ShieldCheck, TrendingUp, TrendingDown, RotateCcw, History, Trash2, MoreHorizontal, RefreshCw, Globe, Loader2, X } from "lucide-react";
import { usePolling } from "@/lib/hooks/usePolling";
import { GeoEnrichmentButton } from "@/components/devices/GeoEnrichmentButton";
import { getCountryName } from "@/lib/geo";

interface DeviceRow {
  id: string;
  deviceName: string | null;
  deviceId: string;
  ipAddress: string | null;
  trustScore: number;
  os: string | null;
  browser: string | null;
  country: string | null;
  isBlacklisted: boolean;
  licenseId: string;
  licenseKey: string;
  organization: string;
  lastSeen: Date | null;
  createdAt: Date;
}

interface DevicesTableProps {
  devices: DeviceRow[];
  autoRefresh?: boolean;
}

export function DevicesTable({ devices: initialDevices, autoRefresh = true }: DevicesTableProps) {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceRow[]>(initialDevices);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [orgFilter, setOrgFilter] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [trustTarget, setTrustTarget] = useState<string | null>(null);
  const [trustScoreInput, setTrustScoreInput] = useState("50");
  const [actionLoading, setActionLoading] = useState(false);
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
      const res = await fetch(`${API_ROUTES.DEVICES.LIST}?pageSize=100`);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success) return;
      const mapped: DeviceRow[] = json.data.activations.map((a: any) => ({
        id: a.id,
        deviceName: a.deviceName,
        deviceId: a.deviceId,
        ipAddress: a.ipAddress,
        trustScore: a.trustScore,
        os: a.os,
        browser: a.browser,
        country: a.country,
        isBlacklisted: a.isBlacklisted,
        licenseId: a.license.id,
        licenseKey: a.license.key,
        organization: a.license.organization,
        lastSeen: a.lastSeen ? new Date(a.lastSeen) : null,
        createdAt: new Date(a.createdAt),
      }));
      setDevices(mapped);
    } catch {
      // silent
    }
  }, []);

  usePolling(fetchDevices, 30000, autoRefreshOn);

  const orgs = useMemo(
    () => [...new Set(devices.map((d) => d.organization))].sort(),
    [devices]
  );

  const filtered = useMemo(() => {
    if (!orgFilter) return devices;
    return devices.filter((d) => d.organization === orgFilter);
  }, [devices, orgFilter]);

  function handleExportCSV() {
    const headers = ["Device Name", "Device ID", "IP Address", "OS", "Browser", "Last Seen", "Trust Score", "License Key", "Organization", "Activated"];
    const rows = filtered.map((d) => [
      d.deviceName || "Unknown",
      d.deviceId,
      d.ipAddress || "",
      d.os || "",
      d.browser || "",
      d.lastSeen ? formatDate(d.lastSeen) : "",
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
  }

  async function handleBlacklist(id: string) {
    const res = await fetch(API_ROUTES.DEVICES.BLACKLIST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to blacklist device");
      return;
    }
    setOpenDropdown(null);
    router.refresh();
    fetchDevices();
  }

  async function handleWhitelist(id: string) {
    const res = await fetch(API_ROUTES.DEVICES.WHITELIST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to whitelist device");
      return;
    }
    setOpenDropdown(null);
    router.refresh();
    fetchDevices();
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke device");
      }
      setRevokeTarget(null);
      setOpenDropdown(null);
      router.refresh();
      fetchDevices();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to revoke device");
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update trust score");
      }
      setTrustTarget(null);
      setOpenDropdown(null);
      router.refresh();
      fetchDevices();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update trust score");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTrustIncrease(id: string) {
    const res = await fetch(API_ROUTES.DEVICES.TRUST_INCREASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to increase trust score");
      return;
    }
    setOpenDropdown(null);
    router.refresh();
    fetchDevices();
  }

  async function handleTrustDecrease(id: string) {
    const res = await fetch(API_ROUTES.DEVICES.TRUST_DECREASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to decrease trust score");
      return;
    }
    setOpenDropdown(null);
    router.refresh();
    fetchDevices();
  }

  async function handleTrustReset(id: string) {
    if (!confirm("Reset trust score to 50?")) return;
    const res = await fetch(API_ROUTES.DEVICES.TRUST_RESET, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to reset trust score");
      return;
    }
    setOpenDropdown(null);
    router.refresh();
    fetchDevices();
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
      }
    } catch {
      // silent
    } finally {
      setEnrichingId(null);
    }
  }

  return (
    <>
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
            ]}
            onClear={() => setOrgFilter("")}
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
          { key: "deviceId", label: "Device ID", sortable: true, searchable: true },
          { key: "ipAddress", label: "IP Address", sortable: true },
          { key: "os", label: "OS", sortable: true },
          { key: "browser", label: "Browser", sortable: true },
          { key: "country", label: "Country", sortable: true },
          { key: "lastSeen", label: "Last Seen", sortable: true },
          { key: "trustScore", label: "Trust Score", sortable: true },
          { key: "isBlacklisted", label: "Status", sortable: true },
          { key: "license", label: "License", sortable: true, searchable: true },
          { key: "organization", label: "Organization", sortable: true, searchable: true },
          { key: "createdAt", label: "Activated", sortable: true },
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
            lastSeen: d.lastSeen ? d.lastSeen.toISOString() : "",
            trustScore: String(d.trustScore),
            isBlacklisted: d.isBlacklisted ? "Blacklisted" : "Active",
            license: d.licenseKey,
            organization: d.organization,
            createdAt: d.createdAt.toISOString(),
            actions: "",
          },
          cells: [
            <Link key="deviceName" href={`/devices/${d.id}`} className="font-medium text-blue-400 hover:underline">
              {d.deviceName || "Unknown Device"}
            </Link>,
            <span key="deviceId" className="font-mono text-xs text-zinc-400">{d.deviceId}</span>,
            <span key="ipAddress">{d.ipAddress || "-"}</span>,
            <span key="os">{d.os || "-"}</span>,
            <span key="browser">{d.browser || "-"}</span>,
            <span key="country" className="group relative">
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
            <span key="lastSeen">{d.lastSeen ? formatDateTime(d.lastSeen) : "-"}</span>,
            <span key="trustScore" className={`font-medium ${d.trustScore >= 60 ? "text-green-400" : d.trustScore >= 30 ? "text-yellow-400" : "text-red-400"}`}>
              {d.trustScore}
            </span>,
            <span key="isBlacklisted">
              {d.isBlacklisted ? (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">Blacklisted</span>
              ) : (
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">Active</span>
              )}
            </span>,
            <Link key="license" href={`/licenses/${d.licenseId}`} className="font-mono text-xs text-blue-400 hover:underline">
              {d.licenseKey}
            </Link>,
            <span key="organization">{d.organization}</span>,
            <span key="createdAt">{formatDate(d.createdAt)}</span>,
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
                  {d.isBlacklisted ? (
                    <button
                      onClick={() => handleWhitelist(d.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <ShieldCheck size={14} className="text-green-400" />
                      Whitelist Device
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlacklist(d.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <Ban size={14} className="text-red-400" />
                      Blacklist Device
                    </button>
                  )}
                  <button
                    onClick={() => { setTrustTarget(d.id); setTrustScoreInput(String(d.trustScore)); setActionError(""); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <TrendingUp size={14} className="text-blue-400" />
                    Update Trust Score
                  </button>
                  <button
                    onClick={() => handleTrustIncrease(d.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <TrendingUp size={14} className="text-green-400" />
                    Increase Trust (+10)
                  </button>
                  <button
                    onClick={() => handleTrustDecrease(d.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    <TrendingDown size={14} className="text-red-400" />
                    Decrease Trust (-10)
                  </button>
                  <button
                    onClick={() => handleTrustReset(d.id)}
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
