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

interface GrantGemsModalProps {
  licenseId: string;
  organization: string;
  rewards?: GemRewardOption[];
}

export default function GrantGemsModal({ licenseId, organization, rewards = [] }: GrantGemsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState(100);
  const [rewardId, setRewardId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  async function handleGrant() {
    setError("");
    if (rewardId && !amount) {
      const reward = rewards.find((r) => r.id === rewardId);
      if (reward) setAmount(reward.amount);
    }
    if (amount < 1) {
      setError("Amount must be at least 1");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = { licenseId, amount };
      if (rewardId) body.rewardId = rewardId;
      if (reason) body.reason = reason;
      if (description) body.description = description;

      const res = await fetch(API_ROUTES.GEMS.GRANT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to grant gems");
        return;
      }
      setOpen(false);
      setAmount(100);
      setRewardId("");
      setReason("");
      setDescription("");
      router.refresh();
    } catch {
      setError("Failed to grant gems");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="primary" size="sm">
        Grant Gems
      </ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Grant Gems"
        description={`Grant gems to ${organization}.`}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleGrant} disabled={loading}>
              {loading ? "Granting..." : "Grant Gems"}
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
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Amount</label>
            <input
              type="number" min="1" value={amount}
              onChange={(e) => { setAmount(Number(e.target.value)); setRewardId(""); }}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Reason</label>
            <input
              type="text" placeholder="e.g. Achievement, Bonus" value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Description (optional)</label>
            <textarea
              placeholder="Additional details..." value={description}
              onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
