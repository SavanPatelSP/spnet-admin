"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { Gem, TrendingUp, Users } from "lucide-react";

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

  const totalGems = amount * licenseIds.length;

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
      size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleGrant} loading={loading}>
            Grant to {licenseIds.length} Licenses
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Step 1: License Summary */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">License Summary</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="text-zinc-500">Total Licenses</div>
            <div className="flex items-center gap-1.5 font-medium text-zinc-100">
              <Users size={14} className="text-zinc-400" />
              {licenseIds.length.toLocaleString()}
            </div>
            <div className="text-zinc-500">License IDs</div>
            <div className="max-h-24 overflow-y-auto">
              {licenseIds.map((id) => (
                <code key={id} className="block text-xs text-zinc-400">{id}</code>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Configure Grant */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
            <h4 className="text-sm font-semibold text-zinc-100">Configure Grant</h4>
          </div>

          {rewards.length > 0 && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Use Reward Template (optional)</label>
              <select
                value={rewardId}
                onChange={(e) => {
                  setRewardId(e.target.value);
                  const r = rewards.find((r) => r.id === e.target.value);
                  if (r) setAmount(r.amount);
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              >
                <option value="">Custom amount...</option>
                {rewards.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.amount} gems)</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Amount per License</label>
            <input
              type="number" min="1" value={amount}
              onChange={(e) => { setAmount(Number(e.target.value)); setRewardId(""); }}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Step 3: Reason */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
            <h4 className="text-sm font-semibold text-zinc-100">Reason</h4>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Grant Reason</label>
            <input
              type="text" placeholder="e.g. Campaign bonus" value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* License Count & Impact Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="mb-2 text-xs font-medium text-zinc-500">Per License</div>
            <div className="flex items-center gap-1.5 text-sm text-zinc-300">
              <Gem size={14} className="text-cyan-400" />
              +{amount.toLocaleString()} gems
            </div>
          </div>
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
            <div className="mb-2 text-xs font-medium text-cyan-400">Total Distribution</div>
            <div className="flex items-center gap-1.5 text-sm text-cyan-300">
              <TrendingUp size={14} className="text-cyan-400" />
              {totalGems.toLocaleString()} gems across {licenseIds.length} license{licenseIds.length !== 1 ? "s" : ""}
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
              <span className="w-24 text-zinc-500">Action</span>
              <span className="text-green-400">BULK_GRANT</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Licenses</span>
              <span className="text-zinc-300">{licenseIds.length.toLocaleString()}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Per License</span>
              <span className="text-green-400">+{amount.toLocaleString()}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Total</span>
              <span className="text-cyan-400">{totalGems.toLocaleString()} gems</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Reason</span>
              <span className="text-zinc-300">{reason || <span className="text-zinc-600">(not set)</span>}</span>
            </div>
            {rewardId && (
              <div className="flex">
                <span className="w-24 text-zinc-500">Reward</span>
                <span className="text-zinc-300">{rewards.find((r) => r.id === rewardId)?.name || rewardId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
