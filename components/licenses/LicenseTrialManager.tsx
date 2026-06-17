"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PLANS } from "@/lib/constants";
import { FlaskConical, Timer } from "lucide-react";

interface Props {
  licenseId: string;
  trialStartDate?: string;
  trialEndDate?: string;
}

export default function LicenseTrialManager({ licenseId, trialStartDate, trialEndDate }: Props) {
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
          <div className="flex items-center gap-3">
            <input type="number" min="1" max="90" value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
              className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-100 outline-none focus:border-blue-500" />
            <span className="text-sm text-zinc-500">days</span>
            <ActionButton onClick={startTrial} variant="primary" size="sm" loading={starting}>
              Start Trial
            </ActionButton>
          </div>
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
          <ActionButton onClick={() => setConvertOpen(true)} variant="secondary" size="sm">
            Convert to Paid
          </ActionButton>
        </div>
      )}

      <Modal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        title="Convert to Paid"
        description="Set the plan and expiry for the paid license."
        size="sm"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setConvertOpen(false)} disabled={converting}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={convertToPaid} loading={converting}>
              {converting ? "Converting..." : "Convert"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Plan</label>
            <select value={convertPlan} onChange={(e) => setConvertPlan(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500">
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Expiry Date (optional)</label>
            <input type="date" value={convertExpiry} onChange={(e) => setConvertExpiry(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
