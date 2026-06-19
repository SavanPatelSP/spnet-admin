"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { API_ROUTES, AUTH, SESSION_EXTENSION_PRICE_PER_MINUTE } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/shared";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/shared";
import {
  Crown, Shield, Server, DollarSign, FileText, TrendingUp, Clock,
  AlertTriangle, CheckCircle, ArrowRight, RotateCcw, Infinity,
  Calendar, Unlock,
} from "lucide-react";

interface SessionRow {
  id: string;
  teamMember: { name: string; email: string } | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

type OverrideOption = "unlimited" | "12h" | "24h" | "7d" | "30d" | "custom" | "restore";

const OPTIONS: { key: OverrideOption; label: string; description: string; icon: React.ReactNode }[] = [
  { key: "unlimited", label: "Unlimited Session", description: "Disable timeout entirely.", icon: <Infinity size={18} /> },
  { key: "12h", label: "12 Hours", description: "Extend session to 12 hours.", icon: <Clock size={18} /> },
  { key: "24h", label: "24 Hours", description: "Extend session to 24 hours.", icon: <Clock size={18} /> },
  { key: "7d", label: "7 Days", description: "Extend session to 7 days.", icon: <Calendar size={18} /> },
  { key: "30d", label: "30 Days", description: "Extend session to 30 days.", icon: <Calendar size={18} /> },
  { key: "custom", label: "Custom Duration", description: "Set a specific duration.", icon: <Clock size={18} /> },
  { key: "restore", label: "Restore Default Policy", description: "Revert to platform default.", icon: <RotateCcw size={18} /> },
];

const OPTION_MINUTES: Record<Exclude<OverrideOption, "custom" | "restore" | "unlimited">, number> = {
  "12h": 720,
  "24h": 1440,
  "7d": 10080,
  "30d": 43200,
};

const UNLIMITED_COST = 100;

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} Minutes`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (minutes < 1440) return remainingMinutes > 0 ? `${hours} Hour${hours > 1 ? "s" : ""} ${remainingMinutes} Minutes` : `${hours} Hour${hours > 1 ? "s" : ""}`;
  const days = Math.floor(minutes / 1440);
  const remainingHours = Math.floor((minutes % 1440) / 60);
  return remainingHours > 0 ? `${days} Day${days > 1 ? "s" : ""} ${remainingHours} Hour${remainingHours > 1 ? "s" : ""}` : `${days} Day${days > 1 ? "s" : ""}`;
}

export function SessionPolicyOverrideModal({
  session,
  onClose,
  onSuccess,
}: {
  session: SessionRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const [option, setOption] = useState<OverrideOption>("unlimited");
  const [customMinutes, setCustomMinutes] = useState(60);
  const [customCooldown, setCustomCooldown] = useState(0);
  const [saving, setSaving] = useState(false);

  const policyDurationMinutes = AUTH.SESSION_MAX_AGE_SECONDS / 60;
  const currentExpiry = session.expiresAt;

  const newExpiry = useMemo(() => {
    if (option === "restore") return new Date(session.createdAt.getTime() + policyDurationMinutes * 60000);
    if (option === "unlimited") return new Date("2099-12-31T23:59:59.999Z");
    const mins = option === "custom" ? customMinutes : OPTION_MINUTES[option];
    return new Date(Date.now() + mins * 60000);
  }, [option, customMinutes, session.createdAt, policyDurationMinutes]);

  const selectedMinutes = useMemo(() => {
    if (option === "unlimited" || option === "restore") return 0;
    return option === "custom" ? customMinutes : OPTION_MINUTES[option];
  }, [option, customMinutes]);

  const newPolicyLabel = useMemo(() => {
    if (option === "restore") return "Default Policy";
    if (option === "unlimited") return "Unlimited Session";
    return formatDuration(selectedMinutes);
  }, [option, selectedMinutes]);

  const costImpact = useMemo(() => {
    if (option === "restore") return 0;
    if (option === "unlimited") return UNLIMITED_COST;
    return (SESSION_EXTENSION_PRICE_PER_MINUTE || 0) * selectedMinutes;
  }, [option, selectedMinutes]);

  const hasCostImpact = costImpact > 0;

  async function handleSubmit() {
    setSaving(true);
    try {
      const res = await fetch("/api/sessions/override-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          option,
          customMinutes: option === "custom" ? customMinutes : undefined,
          customCooldown: option === "custom" ? customCooldown : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Override failed");
      showToast("Session policy overridden", "success");
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Override failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Override Session Policy"
      description={`Bypass standard session policy for ${session.teamMember?.name || "this user"}.`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || option === "custom" && customMinutes < 1}
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {saving ? "Applying..." : "Override Policy"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="mb-3 flex items-center gap-2"><Crown size={16} className="text-purple-400" /><p className="text-sm font-semibold text-zinc-200">Privileged Action</p></div>
          <p className="text-xs text-zinc-400">This action is restricted to Owner and Super Admin roles. It bypasses standard session timeout policies and will be audited.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="text-xs text-zinc-500">Current Policy</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{formatDuration(policyDurationMinutes)}</p>
            <p className="text-[10px] text-zinc-500">Standard platform policy.</p>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
            <p className="text-xs text-purple-300">New Policy</p>
            <p className="mt-1 text-sm font-bold text-zinc-100">{newPolicyLabel}</p>
            <p className="text-[10px] text-purple-300/70">After override is applied.</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Override Option</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setOption(opt.key)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                  option === opt.key
                    ? "border-purple-500/50 bg-purple-500/10"
                    : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900"
                )}
              >
                <div className={cn("rounded-lg p-2", option === opt.key ? "bg-purple-500/20 text-purple-400" : "bg-zinc-800 text-zinc-500")}>{opt.icon}</div>
                <div>
                  <p className={cn("text-sm font-medium", option === opt.key ? "text-purple-300" : "text-zinc-200")}>{opt.label}</p>
                  <p className="text-xs text-zinc-500">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {option === "custom" && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <p className="mb-3 text-sm font-semibold text-zinc-200">Custom Duration</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500"
                />
                <p className="mt-1 text-[10px] text-zinc-500">{formatDuration(customMinutes)}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Cooldown (minutes)</label>
                <input
                  type="number"
                  min={0}
                  value={customCooldown}
                  onChange={(e) => setCustomCooldown(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500"
                />
                <p className="mt-1 text-[10px] text-zinc-500">Optional cooldown before next override.</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-300"><ArrowRight size={16} /> Policy Transition</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-400">Current Expiry</span><span className="font-medium text-zinc-200">{formatDateTime(currentExpiry)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">New Expiry</span><span className="font-bold text-zinc-100">{formatDateTime(newExpiry)}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Shield size={14} /> Security Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{option === "restore" ? "Policy restored" : "Elevated privilege use"}</p>
            <p className="text-[10px] text-zinc-500">{option === "restore" ? "Returns to standard security posture." : "Extends attack window if compromised."}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Server size={14} /> Resource Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{option === "unlimited" ? "Unbounded retention" : option === "restore" ? "Default retention" : formatDuration(selectedMinutes)}</p>
            <p className="text-[10px] text-zinc-500">Additional server resources consumed.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><DollarSign size={14} /> Cost Impact</p>
            <p className={`mt-1 text-sm font-medium ${hasCostImpact ? "text-red-400" : "text-zinc-200"}`}>{hasCostImpact ? formatPrice(costImpact, "$") : "No charge"}</p>
            <p className="text-[10px] text-zinc-500">{hasCostImpact ? "Charged per override policy." : "Restore default has no cost."}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><TrendingUp size={14} /> Forecast Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{option === "unlimited" ? "Permanent session retention" : option === "restore" ? "Standard rotation" : formatDuration(selectedMinutes)}</p>
            <p className="text-[10px] text-zinc-500">Predicted resource consumption.</p>
          </div>
        </div>

        {hasCostImpact && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"><FileText size={14} /> Invoice Preview</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">Session policy override — {newPolicyLabel}</span><span className="text-zinc-200">{formatPrice(costImpact, "$")}</span></div>
              <div className="flex justify-between font-medium"><span className="text-zinc-300">Total</span><span className="text-zinc-100">{formatPrice(costImpact, "$")}</span></div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-300"><AlertTriangle size={16} /> Override Notice</div>
          <p className="text-xs leading-relaxed text-yellow-200/80">This override bypasses the platform session timeout policy. It will be logged, an invoice will be generated if applicable, and the user will retain access until the new expiry.</p>
        </div>
      </div>
    </Modal>
  );
}
