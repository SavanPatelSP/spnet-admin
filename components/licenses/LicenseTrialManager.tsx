"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES, PLANS } from "@/lib/constants";
import { FlaskConical, Timer, Calendar, Eye, Cpu } from "lucide-react";

interface Props {
  licenseId: string;
  trialStartDate?: string;
  trialEndDate?: string;
}

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

export default function LicenseTrialManager({ licenseId, trialStartDate, trialEndDate }: Props) {
  const { hasPermission } = usePermission();
  const router = useRouter();
  const [trialDays, setTrialDays] = useState(14);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const [convertOpen, setConvertOpen] = useState(false);
  const [convertPlan, setConvertPlan] = useState("FREE");
  const [convertExpiry, setConvertExpiry] = useState("");
  const [converting, setConverting] = useState(false);

  const hasTrial = !!trialStartDate && !!trialEndDate;

  const [trialProgress, setTrialProgress] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const now = Date.now();
    const start = trialStartDate ? new Date(trialStartDate).getTime() : 0;
    const end = trialEndDate ? new Date(trialEndDate).getTime() : 0;
    const total = end - start;
    const elapsed = now - start;
    const t1 = setTimeout(() => setTrialProgress(total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0), 0);
    const t2 = setTimeout(() => setDaysRemaining(trialEndDate ? Math.max(0, Math.ceil((end - now) / 86400000)) : 0), 0);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [trialStartDate, trialEndDate]);

  async function startTrial() {
    setError("");
    if (trialDays < 1) { setError("Trial duration must be at least 1 day"); return; }
    setStarting(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.TRIAL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, durationDays: trialDays }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Failed to start trial"); return; }
      router.refresh();
    } catch {
      setError("Failed to start trial");
    } finally {
      setStarting(false);
    }
  }

  async function convertToPaid() {
    setError("");
    setConverting(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.TRIAL_CONVERT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, plan: convertPlan, expiresAt: convertExpiry || undefined }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Conversion failed"); return; }
      setConvertOpen(false);
      router.refresh();
    } catch {
      setError("Conversion failed");
    } finally {
      setConverting(false);
    }
  }

  const expiryDate = convertExpiry ? fmt(new Date(convertExpiry)) : "No expiry";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <FlaskConical size={18} className="text-yellow-400" />
        <h3 className="font-semibold">Trial</h3>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}

      {!hasTrial ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">No trial active for this license.</p>
          {hasPermission("Manage Trials") && (
            <div className="flex items-center gap-3">
              <input type="number" min="1" max="90" value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
                className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-100 outline-none focus:border-blue-500" />
              <span className="text-sm text-zinc-500">days</span>
              <ActionButton onClick={startTrial} variant="primary" size="sm" loading={starting}>
                Start Trial
              </ActionButton>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <Timer size={16} className="text-zinc-500" />
            <span>{daysRemaining} days remaining</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-yellow-500 transition-all" style={{ width: `${trialProgress}%` }} />
          </div>
          {hasPermission("Manage Trials") && (
            <ActionButton onClick={() => setConvertOpen(true)} variant="secondary" size="sm">
              Convert to Paid
            </ActionButton>
          )}
        </div>
      )}

      <Modal
        open={convertOpen}
        onClose={() => { if (!converting) { setConvertOpen(false); setError(""); } }}
        title="Convert to Paid"
        description="Upgrade trial to a paid license plan."
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => { setConvertOpen(false); setError(""); }} disabled={converting}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={convertToPaid} loading={converting}>
              {converting ? "Converting..." : "Convert to Paid"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Select Plan */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Select Plan</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setConvertPlan(p)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    convertPlan === p
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu size={14} className={convertPlan === p ? "text-blue-400" : "text-zinc-500"} />
                    <span className={`text-sm font-medium ${convertPlan === p ? "text-blue-400" : "text-zinc-200"}`}>{p}</span>
                    {convertPlan === p && (
                      <span className="ml-auto text-xs text-blue-400">Selected</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Configuration</h4>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <Calendar className="mr-1 inline" size={12} />
                Expiry Date (optional)
              </label>
              <input type="date" value={convertExpiry} onChange={(e) => setConvertExpiry(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
              <p className="mt-1.5 text-xs text-zinc-500">
                If no date is set, the license will not expire.
              </p>
            </div>
          </div>

          {/* Step 3: Impact Summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <Eye size={14} />
                Impact Summary
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="mb-2 text-xs font-medium text-zinc-500">Before</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Status</span>
                    <span className="text-yellow-400">Trial</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Plan</span>
                    <span className="text-zinc-300">Trial</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Expiry</span>
                    <span className="text-zinc-300">{trialEndDate ? fmt(new Date(trialEndDate)) : "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="mb-2 text-xs font-medium text-blue-400">After</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Status</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Plan</span>
                    <span className="text-blue-400 font-medium">{convertPlan}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Expiry</span>
                    <span className="text-zinc-300">{expiryDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Preview */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex">
                  <span className="w-28 text-zinc-500">Action</span>
                  <span className="text-yellow-400">TRIAL_CONVERTED</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">License</span>
                  <span className="text-zinc-300">{licenseId}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Plan</span>
                  <span className="text-zinc-300">{convertPlan}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Expiry</span>
                  <span className="text-zinc-300">{convertExpiry || "None"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
