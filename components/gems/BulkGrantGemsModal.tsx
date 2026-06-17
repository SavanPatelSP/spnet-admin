"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";

interface GemRewardOption {
  id: string;
  name: string;
  amount: number;
  description: string | null;
}

interface BulkGrantGemsModalProps {
  licenseIds: string[];
  onClose: () => void;
  rewards?: GemRewardOption[];
}

export default function BulkGrantGemsModal({ licenseIds, onClose, rewards = [] }: BulkGrantGemsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(100);
  const [rewardId, setRewardId] = useState("");
  const [reason, setReason] = useState("");

  async function handleGrant() {
    setError("");
    if (amount < 1) { setError("Amount must be at least 1"); return; }
    setLoading(true);
    try {
      const body: Record<string, unknown> = { licenseIds, amount };
      if (rewardId) body.rewardId = rewardId;
      if (reason) body.reason = reason;

      const res = await fetch(API_ROUTES.GEMS.BULK_GRANT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to grant gems");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Failed to grant gems");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Bulk Grant Gems"
      description={`Grant gems to ${licenseIds.length} license${licenseIds.length !== 1 ? "s" : ""}.`}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleGrant} loading={loading}>
            Grant to {licenseIds.length} Licenses
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {rewards.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Use Reward Template (optional)</label>
            <select
              value={rewardId}
              onChange={(e) => {
                setRewardId(e.target.value);
                const r = rewards.find((r) => r.id === e.target.value);
                if (r) setAmount(r.amount);
              }}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            >
              <option value="">Custom amount...</option>
              {rewards.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.amount} gems)</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Amount per License</label>
          <input
            type="number" min="1" value={amount}
            onChange={(e) => { setAmount(Number(e.target.value)); setRewardId(""); }}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Reason</label>
          <input
            type="text" placeholder="e.g. Campaign bonus" value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}
