"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { PREMIUM_PLANS, ADMIN_SUBSCRIPTION_TYPES } from "@/lib/constants";
import { CheckCircle } from "lucide-react";

interface BulkGrantPremiumModalProps {
  licenseIds: string[];
  onClose: () => void;
}

const FEATURE_IMPACT = [
  "Full premium feature access",
  "Priority analytics & reporting",
  "Advanced security policies",
  "Unlimited device registrations",
  "API rate limit increase",
];

export default function BulkGrantPremiumModal({ licenseIds, onClose }: BulkGrantPremiumModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<string>("ENTERPRISE");
  const [durationDays, setDurationDays] = useState(365);
  const [subscriptionType, setSubscriptionType] = useState("YEARLY");
  const [notes, setNotes] = useState("");

  async function handleGrant() {
    if (durationDays < 1) {
      setError("Duration must be at least 1 day");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/premium/bulk-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseIds, plan, durationDays, subscriptionType, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to bulk grant premium");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Failed to bulk grant premium");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Bulk Grant Premium"
      description={`Grant premium to ${licenseIds.length} license(s)`}
      size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleGrant} disabled={loading}>
            {loading ? "Granting..." : `Grant Premium (${licenseIds.length})`}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Step 1: Review */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">Review Selection</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="text-zinc-500">Licenses Selected</div>
            <div className="font-medium text-zinc-100">{licenseIds.length}</div>
            <div className="text-zinc-500">Operation</div>
            <div>
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                Grant Premium
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Configure Plan */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
            <h4 className="text-sm font-semibold text-zinc-100">Configure Plan</h4>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Premium Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500">
              {PREMIUM_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Subscription Type</label>
            <select value={subscriptionType} onChange={(e) => setSubscriptionType(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500">
              {ADMIN_SUBSCRIPTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 3: Duration */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
            <h4 className="text-sm font-semibold text-zinc-100">Duration</h4>
          </div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration (days)</label>
          <input type="number" min="1" max="36500" value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
        </div>

        {/* Step 4: Notes */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">4</span>
            <h4 className="text-sm font-semibold text-zinc-100">Notes</h4>
          </div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Notes (optional)</label>
          <textarea placeholder="Reason for granting premium..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
        </div>

        {/* Feature Impact */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle size={14} className="text-blue-400" />
            <h4 className="text-sm font-semibold text-blue-200">Feature Impact</h4>
          </div>
          <div className="space-y-2">
            {FEATURE_IMPACT.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle size={14} className="mt-0.5 shrink-0 text-blue-400" />
                <span className="text-sm text-blue-100">{f}</span>
              </div>
            ))}
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
              <span className="w-24 text-zinc-500">Action</span>
              <span className="text-yellow-400">BULK_GRANT_PREMIUM</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Licenses</span>
              <span className="text-zinc-300">{licenseIds.length} license(s)</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Plan</span>
              <span className="text-zinc-300">{plan}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Type</span>
              <span className="text-zinc-300">{subscriptionType}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Duration</span>
              <span className="text-zinc-300">{durationDays} days</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Notes</span>
              <span className="text-zinc-300">{notes || <span className="text-zinc-600">(not set)</span>}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
