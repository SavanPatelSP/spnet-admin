"use client";

import { useEffect, useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { API_ROUTES } from "@/lib/constants";
import { formatDateTime } from "@/lib/shared";
import { useToast } from "@/components/ui/Toast";
import { Monitor, Clock, User, AlertTriangle, FileText, Shield } from "lucide-react";

interface SessionRow {
  id: string;
  teamMemberId: string;
  teamMember: { name: string; email: string } | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export function SessionForceLogoutModal({
  session,
  onClose,
  onSuccess,
}: {
  session: SessionRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [impact, setImpact] = useState<{ sessionCount: number; activeDeviceCount: number; lastActivity: string | null } | null>(null);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"current" | "all" | "devices">("current");

  useEffect(() => {
    fetch(`/api/sessions/impact?teamMemberId=${session.teamMemberId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setImpact(d);
      })
      .catch(() => {});
  }, [session.teamMemberId]);

  async function handleAction() {
    setLoading(true);
    try {
      if (mode === "devices") {
        // revoke active device sessions via force-logout with revokeDevices
        const res = await fetch(API_ROUTES.SESSIONS.FORCE_LOGOUT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id, revokeDevices: true }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Action failed");
        showToast("Device sessions revoked", "success");
      } else {
        const res = await fetch(API_ROUTES.SESSIONS.FORCE_LOGOUT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mode === "current" ? { sessionId: session.id } : { teamMemberId: session.teamMemberId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Logout failed");
        showToast(
          mode === "current" ? "Session logged out" : `${data.deletedCount} session(s) logged out`,
          "success"
        );
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Force Logout"
      description="Terminate session access for this user."
      size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">Cancel</button>
          <button
            onClick={handleAction}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Confirm Logout"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <p className="text-xs text-zinc-500">User</p>
          <p className="font-medium text-zinc-200">{session.teamMember?.name || "Unknown"}</p>
          <p className="text-xs text-zinc-500">{session.teamMember?.email || session.ipAddress || "-"}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-3 text-center">
            <Monitor size={16} className="mx-auto text-zinc-500" />
            <p className="mt-1 text-lg font-bold text-zinc-200">{impact?.activeDeviceCount ?? "-"}</p>
            <p className="text-[10px] text-zinc-500">Active Devices</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-3 text-center">
            <Clock size={16} className="mx-auto text-zinc-500" />
            <p className="mt-1 text-lg font-bold text-zinc-200">{impact?.sessionCount ?? "-"}</p>
            <p className="text-[10px] text-zinc-500">Sessions</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-3 text-center">
            <User size={16} className="mx-auto text-zinc-500" />
            <p className="mt-1 text-xs font-bold text-zinc-200">{impact?.lastActivity ? formatDateTime(impact.lastActivity) : "-"}</p>
            <p className="text-[10px] text-zinc-500">Last Activity</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Action</p>
          <div className="space-y-2">
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${mode === "current" ? "border-red-500/50 bg-red-500/10" : "border-zinc-800 bg-zinc-950/30"}`}>
              <input type="radio" name="logoutMode" checked={mode === "current"} onChange={() => setMode("current")} className="h-4 w-4" />
              <span className="text-sm text-zinc-300">Logout current session only</span>
            </label>
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${mode === "all" ? "border-red-500/50 bg-red-500/10" : "border-zinc-800 bg-zinc-950/30"}`}>
              <input type="radio" name="logoutMode" checked={mode === "all"} onChange={() => setMode("all")} className="h-4 w-4" />
              <span className="text-sm text-zinc-300">Logout all sessions for this user</span>
            </label>
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${mode === "devices" ? "border-red-500/50 bg-red-500/10" : "border-zinc-800 bg-zinc-950/30"}`}>
              <input type="radio" name="logoutMode" checked={mode === "devices"} onChange={() => setMode("devices")} className="h-4 w-4" />
              <span className="text-sm text-zinc-300">Revoke active device sessions</span>
            </label>
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-300">Reason</p>
          <div className="relative">
            <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Security incident, policy violation, etc."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Audit Preview */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex">
              <span className="w-28 text-zinc-500">Action</span>
              <span className="text-red-400">FORCE_LOGOUT</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Target</span>
              <span className="text-zinc-300">{session.teamMember?.email || session.id}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Mode</span>
              <span className="text-zinc-300">
                {mode === "current" ? "Single session" : mode === "all" ? "All sessions" : "Revoke devices"}
              </span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Reason</span>
              <span className="text-zinc-300">{reason || "Not specified"}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Impact</span>
              <span className="text-red-400">
                {mode === "current" ? "1 session" : mode === "all" ? `${impact?.sessionCount || "All"} sessions` : `${impact?.activeDeviceCount || "All"} devices`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-500" />
          <p className="text-xs text-yellow-400/90">
            This action is irreversible. The user will be signed out immediately and may lose unsaved work.
          </p>
        </div>
      </div>
    </Modal>
  );
}
