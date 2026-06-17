"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { downloadCSV } from "@/lib/export";
import { Download } from "lucide-react";

export function DevicesExportButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.DEVICES.EXPORT);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "devices-export.csv";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const resList = await fetch(`${API_ROUTES.DEVICES.LIST}?pageSize=10000`);
        if (!resList.ok) throw new Error("Failed to fetch devices");
        const json = await resList.json();
        const devices = json.devices || json.data || json;
        if (Array.isArray(devices)) {
          const headers = ["Device Name", "Device ID", "IP Address", "License Key", "Organization", "Activated"];
          const rows = devices.map((d: Record<string, unknown>) => [
            String(d.deviceName || d.device_name || "Unknown"),
            String(d.deviceId || d.device_id || ""),
            String(d.ipAddress || d.ip_address || ""),
            String(d.licenseKey || d.license_key || ""),
            String(d.organization || ""),
            String(d.createdAt || d.created_at || ""),
          ]);
          downloadCSV("devices", headers, rows);
        }
      }
    } catch {
      const resList = await fetch(`${API_ROUTES.DEVICES.LIST}?pageSize=10000`);
      if (resList.ok) {
        const json = await resList.json();
        const devices = json.devices || json.data || json;
        if (Array.isArray(devices)) {
          const headers = ["Device Name", "Device ID", "IP Address", "License Key", "Organization", "Activated"];
          const rows = devices.map((d: Record<string, unknown>) => [
            String(d.deviceName || d.device_name || "Unknown"),
            String(d.deviceId || d.device_id || ""),
            String(d.ipAddress || d.ip_address || ""),
            String(d.licenseKey || d.license_key || ""),
            String(d.organization || ""),
            String(d.createdAt || d.created_at || ""),
          ]);
          downloadCSV("devices", headers, rows);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionButton onClick={handleExport} variant="secondary" size="sm" loading={loading}>
      <Download size={14} /> Export CSV
    </ActionButton>
  );
}
