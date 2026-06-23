"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermissions";

interface TicketActionsProps {
  ticketId: string;
  currentStatus: string;
  currentAssignee: string | null;
  teamMembers: { id: string; name: string }[];
}

export function TicketActions({ ticketId, currentStatus, currentAssignee, teamMembers }: TicketActionsProps) {
  const { hasPermission } = usePermission();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(status: string) {
    setLoading(status);
    setError("");
    try {
      const res = await fetch(`/api/support/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error); return; }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  async function assign(assigneeId: string) {
    setLoading("assign");
    setError("");
    try {
      const res = await fetch(`/api/support/${ticketId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error); return; }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  if (!hasPermission("Manage Tickets")) return null;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="mb-4 font-semibold">Actions</h3>
      {error && <div className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs text-zinc-500">Change Status</label>
          <div className="flex flex-wrap gap-2">
            {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={loading === s || currentStatus === s}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-30 ${
                  currentStatus === s
                    ? "bg-blue-600 text-white"
                    : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {loading === s ? "..." : s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-zinc-500">Assign To</label>
          <select
            value={currentAssignee || ""}
            onChange={(e) => assign(e.target.value)}
            disabled={loading === "assign"}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
