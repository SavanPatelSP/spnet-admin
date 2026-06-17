"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { downloadCSV } from "@/lib/export";
import { API_ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/shared";
import RevokeDeviceButton from "./RevokeDeviceButton";

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
  createdAt: Date;
}

interface DevicesTableProps {
  devices: DeviceRow[];
}

export function DevicesTable({ devices }: DevicesTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [orgFilter, setOrgFilter] = useState("");

  const orgs = useMemo(
    () => [...new Set(devices.map((d) => d.organization))].sort(),
    [devices]
  );

  const filtered = useMemo(() => {
    if (!orgFilter) return devices;
    return devices.filter((d) => d.organization === orgFilter);
  }, [devices, orgFilter]);

  function handleExportCSV() {
    const headers = ["Device Name", "Device ID", "IP Address", "License Key", "Organization", "Activated"];
    const rows = filtered.map((d) => [
      d.deviceName || "Unknown",
      d.deviceId,
      d.ipAddress || "",
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
        { key: "trustScore", label: "Trust", sortable: true },
        { key: "isBlacklisted", label: "Status", sortable: true },
        { key: "license", label: "License", sortable: true, searchable: true },
        { key: "organization", label: "Organization", sortable: true, searchable: true },
        { key: "createdAt", label: "Activated", sortable: true },
        { key: "actions", label: "Actions", className: "w-24" },
      ]}
      rows={filtered.map((d) => ({
        id: d.id,
        values: {
          deviceName: d.deviceName || "Unknown Device",
          deviceId: d.deviceId,
          ipAddress: d.ipAddress || "",
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
          <RevokeDeviceButton key="actions" id={d.id} />,
        ],
      }))}
      searchPlaceholder="Search by device name, ID, or license..."
      emptyMessage="No activated devices found."
    />
  );
}
