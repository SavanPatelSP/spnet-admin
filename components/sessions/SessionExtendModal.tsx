"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { API_ROUTES, AUTH, SESSION_EXTENSION_PRICE_PER_MINUTE } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/shared";
import { useToast } from "@/components/ui/Toast";
import {
  Clock, Calendar, ArrowRight, Server, DollarSign, FileText,
  Shield, AlertCircle, TrendingUp, User,
} from "lucide-react";

interface SessionRow {
  id: string;
  teamMember: { name: string; email: string } | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

const EXTENSION_OPTIONS = [
  { minutes: 15, label: "15 minutes" },
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 240, label: "4 hours" },
];

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} Hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} Minute${minutes > 1 ? "s" : ""}`);
  if (hours === 0 && minutes === 0 && seconds > 0) parts.push(`${seconds} Seconds`);
  return parts.join(" ") || "0 Minutes";
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} Minutes`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} Hour${hours > 1 ? "s" : ""}`;
  return `${hours} Hour${hours > 1 ? "s" : ""} ${remaining} Minutes`;
}

export function SessionExtendModal({
  session,
  onClose,
  onSuccess,
}: {
  session: SessionRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const [minutes, setMinutes] = useState(60);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const policyDurationSeconds = AUTH.SESSION_MAX_AGE_SECONDS;
  const currentTime = useMemo(() => new Date(now), [now]);
  const currentExpiry = session.expiresAt;
  const remainingSeconds = useMemo(() => Math.max(0, Math.floor((currentExpiry.getTime() - now) / 1000)), [currentExpiry, now]);

  const newExpiry = useMemo(() => new Date(currentExpiry.getTime() + minutes * 60000), [currentExpiry, minutes]);
  const addedDurationLabel = formatMinutes(minutes);

  const costImpact = useMemo(() => {
    const rate = SESSION_EXTENSION_PRICE_PER_MINUTE || 0;
    return rate * minutes;
  }, [minutes]);

  const hasCostImpact = costImpact > 0;

  async function handleExtend() {
    setSaving(true);
    try {
      const res = await fetch(API_ROUTES.SESSIONS.EXTEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, minutes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Extension failed");
      showToast(`Session extended by ${minutes} minutes`, "success");
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Extension failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Extend Session"
      description="Extend the active session duration for this user."
      size="md"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">Cancel</button>
          <button
            onClick={handleExtend}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Extending..." : "Extend Session"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex items-center gap-2">
            <User size={14} className="text-zinc-500" />
            <p className="text-xs text-zinc-500">User</p>
          </div>
          <p className="mt-1 font-medium text-zinc-200">{session.teamMember?.name || "Unknown"}</p>
          <p className="text-xs text-zinc-500">{session.teamMember?.email || session.ipAddress || "-"}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="flex items-center gap-2 text-xs text-zinc-500"><Clock size={12} /> Policy Duration</p>
            <p className="mt-1 font-medium text-zinc-200">{formatDuration(policyDurationSeconds)}</p>
            <p className="text-[10px] text-zinc-500">Configured session policy.</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="flex items-center gap-2 text-xs text-zinc-500"><Calendar size={12} /> Time Remaining</p>
            <p className="mt-1 font-medium text-zinc-200">{formatDuration(remainingSeconds)}</p>
            <p className="text-[10px] text-zinc-500">Live remaining time.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="text-xs text-zinc-500">Started</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{formatDateTime(session.createdAt)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="text-xs text-zinc-500">Expires</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{formatDateTime(currentExpiry)}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Extension Duration</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {EXTENSION_OPTIONS.map((opt) => (
              <button
                key={opt.minutes}
                onClick={() => setMinutes(opt.minutes)}
                className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                  minutes === opt.minutes
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-300"><ArrowRight size={16} /> Resulting Expiry</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-400">Current Time</span><span className="font-medium text-zinc-200">{formatDateTime(currentTime)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Current Expiry</span><span className="font-medium text-zinc-200">{formatDateTime(currentExpiry)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Added</span><span className="font-medium text-blue-300">+{addedDurationLabel}</span></div>
            <div className="flex justify-between border-t border-blue-500/20 pt-2"><span className="text-zinc-300">New Expiry</span><span className="font-bold text-zinc-100">{formatDateTime(newExpiry)}</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-300"><AlertCircle size={16} /> Resource Impact</div>
          <p className="text-xs leading-relaxed text-yellow-200/80">Extending session duration consumes additional platform resources. The server must retain session state, memory, and background cleanup processes for the added {formatMinutes(minutes).toLowerCase()}.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Server size={14} /> Resource Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">+{formatMinutes(minutes)}</p>
            <p className="text-[10px] text-zinc-500">Additional active server time.</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Shield size={14} /> Administrative Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">Audit log + record update</p>
            <p className="text-[10px] text-zinc-500">Session extension will be logged.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><DollarSign size={14} /> Cost Impact</p>
            <p className={`mt-1 text-sm font-medium ${hasCostImpact ? "text-red-400" : "text-zinc-200"}`}>{hasCostImpact ? formatPrice(costImpact, "$") : "No direct charge"}</p>
            <p className="text-[10px] text-zinc-500">{hasCostImpact ? `${formatPrice(SESSION_EXTENSION_PRICE_PER_MINUTE, "$")} per minute × ${minutes} min` : "Session time is included in active licensing."}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><TrendingUp size={14} /> Forecast Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">+{formatMinutes(minutes).toLowerCase()} retention</p>
            <p className="text-[10px] text-zinc-500">Longer sessions increase retention window.</p>
          </div>
        </div>

        {hasCostImpact && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"><FileText size={14} /> Invoice Preview</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Session extension ({formatMinutes(minutes).toLowerCase()})</span><span className="text-zinc-200">{formatPrice(costImpact, "$")}</span></div>
              <div className="flex justify-between font-medium"><span className="text-zinc-300">Total</span><span className="text-zinc-100">{formatPrice(costImpact, "$")}</span></div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
