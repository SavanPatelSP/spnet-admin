"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermissions";

interface ResolveReportFormProps {
  reportId: string;
  targetType: string;
  targetId: string;
}

export function ResolveReportForm({ reportId, targetType, targetId }: ResolveReportFormProps) {
  const { hasPermission } = usePermission();
  const router = useRouter();
  const [status, setStatus] = useState("RESOLVED");
  const [actionTaken, setActionTaken] = useState("NONE");
  const [reason, setReason] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/moderation/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          actionTaken: actionTaken === "NONE" ? null : actionTaken,
          reason: reason || undefined,
          targetType: actionTaken !== "NONE" ? targetType : undefined,
          targetId: actionTaken !== "NONE" ? targetId : undefined,
          durationDays: durationDays ? Number(durationDays) : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to resolve report");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!hasPermission("Moderate Content")) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>}

      <div>
        <label className="mb-1.5 block text-sm text-zinc-500">Resolution Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
        >
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="INVESTIGATING">Mark as Investigating</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-500">Action Taken</label>
        <select
          value={actionTaken}
          onChange={(e) => setActionTaken(e.target.value)}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
        >
          <option value="NONE">No Action</option>
          <option value="WARNING">Issue Warning</option>
          <option value="SUSPENSION">Suspend License</option>
          <option value="REINSTATEMENT">Reinstate License</option>
          <option value="BAN">Permanent Ban</option>
        </select>
        {actionTaken === "SUSPENSION" && (
          <p className="mt-1 text-xs text-yellow-400">This will suspend the license in the system</p>
        )}
        {actionTaken === "REINSTATEMENT" && (
          <p className="mt-1 text-xs text-green-400">This will reactivate the license</p>
        )}
      </div>

      {(actionTaken === "SUSPENSION") && (
        <div>
          <label className="mb-1.5 block text-sm text-zinc-500">Duration (days)</label>
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="Leave empty for permanent"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm text-zinc-500">Reason for Action</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Explain the moderation decision..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Submit Resolution"}
      </button>
    </form>
  );
}
