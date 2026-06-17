"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { PREMIUM_PLANS, SUBSCRIPTION_TYPES } from "@/lib/constants";

interface BulkGrantPremiumModalProps {
  licenseIds: string[];
  onClose: () => void;
}

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
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleGrant} disabled={loading}>
            {loading ? "Granting..." : `Grant Premium (${licenseIds.length})`}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Premium Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500">
            {PREMIUM_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Subscription Type</label>
          <select value={subscriptionType} onChange={(e) => setSubscriptionType(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500">
            {SUBSCRIPTION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Duration (days)</label>
          <input type="number" min="1" max="36500" value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Notes (optional)</label>
          <textarea placeholder="Reason for granting..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
        </div>
      </div>
    </Modal>
  );
}
