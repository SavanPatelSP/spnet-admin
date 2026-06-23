"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermissions";
import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function DangerZone() {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [lockdownOpen, setLockdownOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleEmergencyLockdown() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/licenses/emergency-mode", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to initiate lockdown");
        return;
      }
      setLockdownOpen(false);
      setSuccess("Emergency lockdown activated. All licenses suspended.");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeAllSessions() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/team-members/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to revoke sessions");
        return;
      }
      setRevokeOpen(false);
      setSuccess("All sessions revoked. Users must log in again.");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportAuditLogs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/audit-logs/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess("Audit logs exported successfully.");
    } catch {
      setError("Failed to export audit logs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-red-900 bg-red-950/20 p-6">
      <div className="mb-4 flex items-center gap-3">
        <AlertTriangle className="text-red-400" />
        <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
      </div>

      {success && (
        <div className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-400">{success}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {(() => {
        const canLockdown = hasPermission("Emergency Lockdown");
        const canRevoke = hasPermission("Force Logout");
        const canExport = hasPermission("Export Audit Logs");
        if (!canLockdown && !canRevoke && !canExport) return null;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {canLockdown && (
              <button onClick={() => setLockdownOpen(true)} className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-500">
                Emergency Lockdown
              </button>
            )}
            {canRevoke && (
              <button onClick={() => setRevokeOpen(true)} className="rounded-xl bg-yellow-600 px-4 py-3 font-medium text-white transition-colors hover:bg-yellow-500">
                Revoke All Sessions
              </button>
            )}
            {canExport && (
              <button onClick={handleExportAuditLogs} disabled={loading} className="rounded-xl bg-zinc-700 px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-600 disabled:opacity-50">
                {loading ? "Exporting..." : "Export Audit Logs"}
              </button>
            )}
          </div>
        );
      })()}

      <p className="mt-4 text-sm text-zinc-500">Restricted to OWNER and SUPER_ADMIN roles.</p>

      <ConfirmDialog
        open={lockdownOpen}
        onClose={() => setLockdownOpen(false)}
        onConfirm={handleEmergencyLockdown}
        title="Emergency Lockdown"
        description="This will SUSPEND ALL active licenses immediately. All users will lose access until manually reactivated. Are you absolutely sure?"
        confirmLabel="Activate Emergency Lockdown"
        variant="danger"
        loading={loading}
      />

      <ConfirmDialog
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={handleRevokeAllSessions}
        title="Revoke All Sessions"
        description="All team members will be logged out immediately and must log in again. Are you sure?"
        confirmLabel="Revoke All Sessions"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
