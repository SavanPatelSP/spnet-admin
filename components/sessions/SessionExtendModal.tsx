"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { API_ROUTES, AUTH, SESSION_EXTENSION_PRICE_PER_MINUTE } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/shared";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/shared";
import {
  Clock, Calendar, ArrowRight, Server, DollarSign, FileText,
  Shield, AlertCircle, TrendingUp, User, Star, Crown, Sparkles, Zap, Gem,
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
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hr" },
  { minutes: 120, label: "2 hr" },
  { minutes: 240, label: "4 hr" },
];

const PREMIUM_MULTIPLIER = 2;

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} Hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} Minute${minutes > 1 ? "s" : ""}`);
  if (hours === 0 && minutes === 0) parts.push("0 Minutes");
  return parts.join(" ");
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
  const [customMinutes, setCustomMinutes] = useState(60);
  const [useCustom, setUseCustom] = useState(false);
  const [premium, setPremium] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const effectiveMinutes = useMemo(() => useCustom ? customMinutes : minutes, [useCustom, customMinutes, minutes]);
  const policyDurationSeconds = AUTH.SESSION_MAX_AGE_SECONDS;
  const currentTime = useMemo(() => new Date(now), [now]);
  const currentExpiry = session.expiresAt;
  const remainingSeconds = useMemo(() => Math.max(0, Math.floor((currentExpiry.getTime() - now) / 1000)), [currentExpiry, now]);

  const newExpiry = useMemo(() => new Date(currentExpiry.getTime() + effectiveMinutes * 60000), [currentExpiry, effectiveMinutes]);
  const addedDurationLabel = formatMinutes(effectiveMinutes);

  const baseCost = useMemo(() => {
    const rate = SESSION_EXTENSION_PRICE_PER_MINUTE || 0;
    return rate * effectiveMinutes;
  }, [effectiveMinutes]);

  const costImpact = useMemo(() => premium ? baseCost * PREMIUM_MULTIPLIER : baseCost, [premium, baseCost]);
  const hasCostImpact = costImpact > 0;

  async function handleExtend() {
    setSaving(true);
    try {
      const res = await fetch(API_ROUTES.SESSIONS.EXTEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          minutes: effectiveMinutes,
          premium,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Extension failed");
      showToast(
        premium ? `Premium session extended by ${effectiveMinutes} minutes` : `Session extended by ${effectiveMinutes} minutes`,
        "success"
      );
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
      description="Extend the active session duration. Premium quality upgrades priority processing."
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">Cancel</button>
          <button
            onClick={handleExtend}
            disabled={saving || effectiveMinutes < 1}
            className={`rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              premium ? "bg-amber-600 hover:bg-amber-500" : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {saving ? "Extending..." : premium ? "Grant Premium Extension" : "Extend Session"}
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
                onClick={() => { setMinutes(opt.minutes); setUseCustom(false); }}
                className={cn(
                  "rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
                  !useCustom && minutes === opt.minutes
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:bg-zinc-800"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/30 p-3 transition-colors hover:bg-zinc-900">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600"
              />
              <span className="text-sm text-zinc-300">Custom duration</span>
            </label>
            {useCustom && (
              <div className="mt-2">
                <input
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500"
                />
                <p className="mt-1 text-[10px] text-zinc-500">{formatMinutes(customMinutes)}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Quality Tier</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPremium(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                !premium ? "border-blue-500/50 bg-blue-500/10" : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900"
              )}
            >
              <div className={cn("rounded-lg p-2", !premium ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500")}>
                <Zap size={18} />
              </div>
              <div>
                <p className={cn("text-sm font-medium", !premium ? "text-blue-300" : "text-zinc-200")}>Standard</p>
                <p className="text-xs text-zinc-500">Regular session extension</p>
              </div>
            </button>
            <button
              onClick={() => setPremium(true)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                premium ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900"
              )}
            >
              <div className={cn("rounded-lg p-2", premium ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-500")}>
                <Crown size={18} />
              </div>
              <div>
                <p className={cn("text-sm font-medium", premium ? "text-amber-300" : "text-zinc-200")}>
                  <Sparkles size={12} className="mr-1 inline text-amber-400" />
                  Premium
                </p>
                <p className="text-xs text-zinc-500">Priority processing &times;{PREMIUM_MULTIPLIER}</p>
              </div>
            </button>
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
          <p className="text-xs leading-relaxed text-yellow-200/80">{premium ? "Premium" : "Standard"} session extension adds {formatMinutes(effectiveMinutes).toLowerCase()} of additional server retention{premium ? " with priority resource allocation" : ""}.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Server size={14} /> Resource Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">+{formatMinutes(effectiveMinutes)}{premium ? " (priority)" : ""}</p>
            <p className="text-[10px] text-zinc-500">{premium ? "Priority server allocation." : "Additional active server time."}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Shield size={14} /> Administrative Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">Audit log + record update</p>
            <p className="text-[10px] text-zinc-500">Extension will be logged.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><DollarSign size={14} /> Cost Impact</p>
            <p className={`mt-1 text-sm font-medium ${hasCostImpact ? "text-red-400" : "text-zinc-200"}`}>
              {hasCostImpact ? formatPrice(costImpact, "$") : "No direct charge"}
              {premium && hasCostImpact && <Star size={12} className="ml-1 inline text-amber-400" />}
            </p>
            <p className="text-[10px] text-zinc-500">
              {hasCostImpact
                ? `${formatPrice(SESSION_EXTENSION_PRICE_PER_MINUTE, "$")}${premium ? ` × ${PREMIUM_MULTIPLIER} premium` : ""} per min × ${effectiveMinutes} min`
                : "Session time is included in active licensing."}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><TrendingUp size={14} /> Forecast Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">+{formatMinutes(effectiveMinutes).toLowerCase()} retention</p>
            <p className="text-[10px] text-zinc-500">{premium ? "Premium tier retention." : "Standard retention window."}</p>
          </div>
        </div>

        {hasCostImpact && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <FileText size={14} />
              Invoice Preview {premium && <Sparkles size={12} className="text-amber-400" />}
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">{premium ? "Premium " : ""}Session extension ({formatMinutes(effectiveMinutes).toLowerCase()})</span>
                <span className="text-zinc-200">{formatPrice(costImpact, "$")}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-zinc-300">Total</span>
                <span className="text-zinc-100">{formatPrice(costImpact, "$")}</span>
              </div>
              {premium && (
                <p className="text-[10px] text-amber-400/70">Premium quality surcharge: &times;{PREMIUM_MULTIPLIER}</p>
              )}
            </div>
          </div>
        )}

        {/* Audit Preview */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex">
              <span className="w-28 text-zinc-500">Action</span>
              <span className="text-blue-400">SESSION_EXTENDED</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Target</span>
              <span className="text-zinc-300">{session.teamMember?.email || session.id}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Duration</span>
              <span className="text-zinc-300">+{formatMinutes(effectiveMinutes)}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">New Expiry</span>
              <span className="text-blue-400">{formatDateTime(newExpiry)}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Quality</span>
              <span className={premium ? "text-amber-400" : "text-zinc-300"}>{premium ? "Premium" : "Standard"}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Cost</span>
              <span className={hasCostImpact ? "text-red-400" : "text-zinc-500"}>{hasCostImpact ? formatPrice(costImpact, "$") : "No charge"}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
