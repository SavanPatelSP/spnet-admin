"use client";

import { useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { Modal } from "@/components/ui/Modal";
import { API_ROUTES, AUTH, SESSION_EXTENSION_PRICE_PER_MINUTE } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/shared";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/shared";
import {
  Crown, Shield, Server, DollarSign, FileText, TrendingUp, Clock,
  AlertTriangle, CheckCircle, ArrowRight, RotateCcw, Infinity,
  Calendar, Unlock, Lock, Timer,
} from "lucide-react";

interface SessionRow {
  id: string;
  teamMember: { name: string; email: string } | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

type OverridePolicyOption = "unlimited" | "12h" | "24h" | "7d" | "30d" | "custom" | "restore";
type CooldownOption = "0min" | "5min" | "10min" | "30min" | "1h" | "custom" | "restore";

const POLICY_OPTIONS: { key: OverridePolicyOption; label: string; description: string; icon: React.ReactNode }[] = [
  { key: "unlimited", label: "Unlimited Session", description: "Disable timeout entirely.", icon: <Infinity size={18} /> },
  { key: "12h", label: "12 Hours", description: "Extend session to 12 hours.", icon: <Clock size={18} /> },
  { key: "24h", label: "24 Hours", description: "Extend session to 24 hours.", icon: <Clock size={18} /> },
  { key: "7d", label: "7 Days", description: "Extend session to 7 days.", icon: <Calendar size={18} /> },
  { key: "30d", label: "30 Days", description: "Extend session to 30 days.", icon: <Calendar size={18} /> },
  { key: "custom", label: "Custom Duration", description: "Set a specific duration.", icon: <Clock size={18} /> },
  { key: "restore", label: "Restore Default Policy", description: "Revert to platform default.", icon: <RotateCcw size={18} /> },
];

const COOLDOWN_OPTIONS: { key: CooldownOption; label: string; minutes: number }[] = [
  { key: "0min", label: "No Cooldown", minutes: 0 },
  { key: "5min", label: "5 Minutes", minutes: 5 },
  { key: "10min", label: "10 Minutes", minutes: 10 },
  { key: "30min", label: "30 Minutes", minutes: 30 },
  { key: "1h", label: "1 Hour", minutes: 60 },
  { key: "custom", label: "Custom", minutes: 0 },
  { key: "restore", label: "Restore Default", minutes: -1 },
];

const OPTION_MINUTES: Record<Exclude<OverridePolicyOption, "custom" | "restore" | "unlimited">, number> = {
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
  const { mutate } = useSWRConfig();
  const [tab, setTab] = useState<"policy" | "cooldown">("policy");

  // Policy state
  const [policyOption, setPolicyOption] = useState<OverridePolicyOption>("unlimited");
  const [customMinutes, setCustomMinutes] = useState(60);

  // Cooldown state
  const [cooldownOption, setCooldownOption] = useState<CooldownOption>("0min");
  const [customCooldown, setCustomCooldown] = useState(10);

  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [verification, setVerification] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const policyDurationMinutes = AUTH.SESSION_MAX_AGE_SECONDS / 60;
  const currentExpiry = session.expiresAt;

  const newExpiry = useMemo(() => {
    if (policyOption === "restore") return new Date(session.createdAt.getTime() + policyDurationMinutes * 60000);
    if (policyOption === "unlimited") return new Date("2099-12-31T23:59:59.999Z");
    const mins = policyOption === "custom" ? customMinutes : OPTION_MINUTES[policyOption];
    return new Date(now + mins * 60000);
  }, [policyOption, customMinutes, session.createdAt, policyDurationMinutes, now]);

  const selectedMinutes = useMemo(() => {
    if (policyOption === "unlimited" || policyOption === "restore") return 0;
    return policyOption === "custom" ? customMinutes : OPTION_MINUTES[policyOption];
  }, [policyOption, customMinutes]);

  const newPolicyLabel = useMemo(() => {
    if (policyOption === "restore") return "Default Policy";
    if (policyOption === "unlimited") return "Unlimited Session";
    return formatDuration(selectedMinutes);
  }, [policyOption, selectedMinutes]);

  const selectedCooldownMinutes = useMemo(() => {
    const opt = COOLDOWN_OPTIONS.find((o) => o.key === cooldownOption);
    if (!opt) return 0;
    if (cooldownOption === "custom") return customCooldown;
    if (cooldownOption === "restore") return -1;
    return opt.minutes;
  }, [cooldownOption, customCooldown]);

  const costImpact = useMemo(() => {
    if (policyOption === "restore") return 0;
    if (policyOption === "unlimited") return UNLIMITED_COST;
    return (SESSION_EXTENSION_PRICE_PER_MINUTE || 0) * selectedMinutes;
  }, [policyOption, selectedMinutes]);

  const hasCostImpact = costImpact > 0;

  const cooldownCost = useMemo(() => {
    if (cooldownOption === "restore") return 0;
    return (SESSION_EXTENSION_PRICE_PER_MINUTE || 0) * selectedCooldownMinutes;
  }, [cooldownOption, selectedCooldownMinutes]);

  async function handleSubmit() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        sessionId: session.id,
      };

      if (tab === "policy") {
        body.option = policyOption;
        if (policyOption === "custom") {
          body.customMinutes = customMinutes;
          body.customCooldown = customCooldown;
        }
      } else {
        body.cooldownOnly = true;
        body.cooldownOption = cooldownOption;
        body.customCooldown = selectedCooldownMinutes;
      }

      const res = await fetch("/api/sessions/override-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Override failed");
      const newExpiresAt = data.session?.expiresAt;
      mutate("/api/sessions/me");
      if (newExpiresAt) {
        window.dispatchEvent(new CustomEvent("session-updated", { detail: { sessionId: session.id, expiresAt: newExpiresAt } }));
      }
      setVerification(data.verification || {});
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
      title="Session Override"
      description={`Manage session policy and login tenure for ${session.teamMember?.name || "this user"}.`}
      size="lg"
      footer={
        verification ? (
          <button
            onClick={() => { onSuccess(); onClose(); }}
            className="ml-auto rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <CheckCircle size={14} className="mr-1.5 inline" /> Close
          </button>
        ) : (
          <>
            <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={saving || (tab === "policy" && policyOption === "custom" && customMinutes < 1)}
              className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {saving ? "Applying..." : tab === "policy" ? "Override Policy" : "Update Cooldown"}
            </button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="mb-3 flex items-center gap-2"><Crown size={16} className="text-purple-400" /><p className="text-sm font-semibold text-zinc-200">Privileged Action</p></div>
          <p className="text-xs text-zinc-400">This action is restricted to Owner and Super Admin roles.</p>
        </div>

        <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/50 p-1">
          <button
            onClick={() => setTab("policy")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === "policy" ? "bg-purple-500/20 text-purple-300" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Crown size={14} className="mr-1.5 inline" /> Override Session Policy
          </button>
          <button
            onClick={() => setTab("cooldown")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === "cooldown" ? "bg-purple-500/20 text-purple-300" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Timer size={14} className="mr-1.5 inline" /> Override Login Tenure
          </button>
        </div>

        {tab === "policy" && (
          <>
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
              <p className="mb-2 text-sm font-medium text-zinc-300">Override Session Policy</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {POLICY_OPTIONS.map((opt) => (
                  <button key={opt.key} onClick={() => setPolicyOption(opt.key)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      policyOption === opt.key ? "border-purple-500/50 bg-purple-500/10" : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900"
                    )}>
                    <div className={cn("rounded-lg p-2", policyOption === opt.key ? "bg-purple-500/20 text-purple-400" : "bg-zinc-800 text-zinc-500")}>{opt.icon}</div>
                    <div>
                      <p className={cn("text-sm font-medium", policyOption === opt.key ? "text-purple-300" : "text-zinc-200")}>{opt.label}</p>
                      <p className="text-xs text-zinc-500">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {policyOption === "custom" && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Custom Duration (minutes)</label>
                <input type="number" min={1} value={customMinutes} onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500" />
                <p className="mt-1 text-[10px] text-zinc-500">{formatDuration(customMinutes)}</p>
              </div>
            )}

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-300"><ArrowRight size={16} /> Policy Transition</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-400">Current Expiry</span><span className="font-medium text-zinc-200">{formatDateTime(currentExpiry)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">New Expiry</span><span className="font-bold text-zinc-100">{formatDateTime(newExpiry)}</span></div>
              </div>
            </div>
          </>
        )}

        {tab === "cooldown" && (
          <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="flex items-center gap-2 text-xs text-zinc-500"><Lock size={12} /> Current Cooldown</p>
              <p className="mt-1 text-sm font-medium text-zinc-200">Platform default</p>
              <p className="text-[10px] text-zinc-500">Users must wait before logging in after session expiry.</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-300">Override Login Tenure</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {COOLDOWN_OPTIONS.map((opt) => (
                  <button key={opt.key} onClick={() => setCooldownOption(opt.key)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      cooldownOption === opt.key ? "border-amber-500/50 bg-amber-500/10" : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900"
                    )}>
                    <div className={cn("rounded-lg p-2", cooldownOption === opt.key ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-500")}>
                      {opt.key === "restore" ? <RotateCcw size={18} /> : <Timer size={18} />}
                    </div>
                    <div>
                      <p className={cn("text-sm font-medium", cooldownOption === opt.key ? "text-amber-300" : "text-zinc-200")}>{opt.label}</p>
                      <p className="text-xs text-zinc-500">{opt.key === "restore" ? "Revert to platform default." : `Cooldown: ${opt.minutes >= 0 ? `${opt.minutes} min` : "Default"}`}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {cooldownOption === "custom" && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Custom Cooldown (minutes)</label>
                <input type="number" min={0} value={customCooldown} onChange={(e) => setCustomCooldown(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500" />
                <p className="mt-1 text-[10px] text-zinc-500">Cooldown before next login attempt after expiry.</p>
              </div>
            )}

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300"><ArrowRight size={16} /> Cooldown Transition</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-400">Current Cooldown</span><span className="font-medium text-zinc-200">Platform default</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">New Cooldown</span><span className="font-bold text-zinc-100">
                  {cooldownOption === "restore" ? "Default" : selectedCooldownMinutes >= 0 ? `${selectedCooldownMinutes} minutes` : "Default"}
                </span></div>
                <div className="flex justify-between border-t border-amber-500/20 pt-2"><span className="text-zinc-400">Est. Impact on Re-auth</span><span className="font-bold text-zinc-100">
                  {cooldownOption === "restore" ? "Platform default wait time" : selectedCooldownMinutes >= 0 ? `+${formatDuration(selectedCooldownMinutes)} before retry` : "No change"}
                </span></div>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Shield size={14} /> Security Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">
              {tab === "policy"
                ? (policyOption === "restore" ? "Policy restored" : "Elevated privilege use")
                : (cooldownOption === "restore" ? "Default restored" : "Cooldown adjusted")}
            </p>
            <p className="text-[10px] text-zinc-500">
              {tab === "policy"
                ? (policyOption === "unlimited" ? "Extends attack window if compromised." : "Managed session duration.")
                : "Controls re-auth timing."}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><Server size={14} /> Resource Impact</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">
              {tab === "policy"
                ? (policyOption === "unlimited" ? "Unbounded" : policyOption === "restore" ? "Default" : formatDuration(selectedMinutes))
                : (cooldownOption === "restore" ? "Default" : `${selectedCooldownMinutes} min`)}
            </p>
            <p className="text-[10px] text-zinc-500">
              {tab === "policy" ? "Session retention." : "Login throttle period."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><DollarSign size={14} /> Cost Impact</p>
            <p className={`mt-1 text-sm font-medium ${tab === "policy" && hasCostImpact ? "text-red-400" : tab === "cooldown" && cooldownCost > 0 ? "text-red-400" : "text-zinc-200"}`}>
              {tab === "policy" ? (hasCostImpact ? formatPrice(costImpact, "$") : "No charge") : cooldownCost > 0 ? formatPrice(cooldownCost, "$") : "No charge"}
            </p>
            <p className="text-[10px] text-zinc-500">
              {tab === "policy" ? (hasCostImpact ? "Override billed." : "Default policy.") : cooldownCost > 0 ? "Tenure change billed." : "Cooldown changes within standard range."}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-zinc-400"><TrendingUp size={14} /> Revenue Impact</p>
            <p className="mt-1 text-sm font-medium text-emerald-400">
              {tab === "policy" ? (hasCostImpact ? `+${formatPrice(costImpact, "$")}` : "No revenue") : cooldownCost > 0 ? `+${formatPrice(cooldownCost, "$")}` : "No revenue"}
            </p>
            <p className="text-[10px] text-zinc-500">
              {(tab === "policy" && hasCostImpact) || (tab === "cooldown" && cooldownCost > 0) ? "Invoice generated." : "No billing impact."}
            </p>
          </div>
        </div>

        {(tab === "policy" && hasCostImpact) || (tab === "cooldown" && cooldownCost > 0) ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"><FileText size={14} /> Invoice Preview</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">{tab === "policy" ? `Session policy override — ${newPolicyLabel}` : `Login tenure override — ${formatDuration(selectedCooldownMinutes)} cooldown`}</span>
                <span className="text-zinc-200">{formatPrice(tab === "policy" ? costImpact : cooldownCost, "$")}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-zinc-300">Total</span>
                <span className="text-zinc-100">{formatPrice(tab === "policy" ? costImpact : cooldownCost, "$")}</span>
              </div>
              <p className="text-[10px] text-zinc-500">Auto-generated invoice. Category: Session - {tab === "policy" ? "Policy Override" : "Login Tenure"}. Due in 30 days.</p>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex"><span className="w-28 text-zinc-500">Action</span><span className="text-yellow-400">{tab === "policy" ? "SESSION_POLICY_OVERRIDDEN" : "LOGIN_TENURE_OVERRIDDEN"}</span></div>
            <div className="flex"><span className="w-28 text-zinc-500">Target</span><span className="text-zinc-300">{session.teamMember?.email || session.id}</span></div>
            <div className="flex"><span className="w-28 text-zinc-500">Tab</span><span className="text-zinc-300">{tab === "policy" ? "Session Policy" : "Login Tenure"}</span></div>
            {tab === "policy" && (
              <>
                <div className="flex"><span className="w-28 text-zinc-500">New Policy</span><span className="text-zinc-300">{newPolicyLabel}</span></div>
                <div className="flex"><span className="w-28 text-zinc-500">New Expiry</span><span className="text-blue-400">{formatDateTime(newExpiry)}</span></div>
              </>
            )}
            {tab === "cooldown" && (
              <>
                <div className="flex"><span className="w-28 text-zinc-500">Cooldown</span><span className="text-zinc-300">{selectedCooldownMinutes >= 0 ? `${formatDuration(selectedCooldownMinutes)}` : "Default"}</span></div>
                <div className="flex"><span className="w-28 text-zinc-500">Session</span><span className="text-zinc-300">Remains at current expiry</span></div>
              </>
            )}
            <div className="flex"><span className="w-28 text-zinc-500">Cost</span><span className={(tab === "policy" && hasCostImpact) || (tab === "cooldown" && cooldownCost > 0) ? "text-red-400" : "text-zinc-500"}>{(tab === "policy" && hasCostImpact) ? formatPrice(costImpact, "$") : (tab === "cooldown" && cooldownCost > 0) ? formatPrice(cooldownCost, "$") : "No charge"}</span></div>
          </div>
        </div>

        {verification && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Verification Evidence</h4>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex"><span className="w-32 text-zinc-500">Action</span><span className="text-emerald-400">{(verification.type as string) === "policy_override" ? "SESSION_POLICY_OVERRIDDEN" : "LOGIN_TENURE_OVERRIDDEN"}</span></div>
              {(verification.type as string) === "policy_override" ? (
                <>
                  <div className="flex"><span className="w-32 text-zinc-500">Previous Expiry</span><span className="text-zinc-400">{verification.previousExpiry ? formatDateTime(new Date(verification.previousExpiry as string)) : "-"}</span></div>
                  <div className="flex"><span className="w-32 text-zinc-500">New Expiry</span><span className="text-blue-400">{verification.newExpiry ? formatDateTime(new Date(verification.newExpiry as string)) : "-"}</span></div>
                  <div className="flex"><span className="w-32 text-zinc-500">New Policy</span><span className="text-zinc-300">{verification.newPolicy as string}</span></div>
                </>
              ) : (
                <>
                  <div className="flex"><span className="w-32 text-zinc-500">Previous Cooldown</span><span className="text-zinc-400">{verification.previousCooldown != null ? `${verification.previousCooldown as number} min` : "Default"}</span></div>
                  <div className="flex"><span className="w-32 text-zinc-500">New Cooldown</span><span className="text-amber-400">{verification.newCooldown != null ? `${verification.newCooldown as number} min` : "Default"}</span></div>
                </>
              )}
              <div className="flex"><span className="w-32 text-zinc-500">Overridden By</span><span className="text-zinc-300">{verification.overriddenBy as string} ({verification.overriddenByEmail as string})</span></div>
              <div className="flex"><span className="w-32 text-zinc-500">Timestamp</span><span className="text-zinc-300">{verification.timestamp ? formatDateTime(new Date(verification.timestamp as string)) : "-"}</span></div>
              <div className="flex"><span className="w-32 text-zinc-500">Audit Ref</span><span className="text-zinc-400">{verification.auditReference ? (verification.auditReference as string).slice(0, 12) + "..." : "N/A"}</span></div>
              {(verification.invoiceId as string | undefined | null) && (
                <div className="flex"><span className="w-32 text-zinc-500">Invoice</span><span className="text-amber-400">{(verification.invoiceId as string).slice(0, 12)}...</span></div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-300"><AlertTriangle size={16} /> Override Notice</div>
          <p className="text-xs leading-relaxed text-yellow-200/80">This action will be logged and an invoice will be generated if applicable. Changes take effect immediately.</p>
        </div>
      </div>
    </Modal>
  );
}
