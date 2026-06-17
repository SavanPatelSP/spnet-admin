"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  active: boolean;
  cooldownDays: number | null;
}

interface Props {
  reward: Reward;
}

export default function EditRewardModal({ reward }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(reward.name);
  const [description, setDescription] = useState(reward.description || "");
  const [amount, setAmount] = useState(String(reward.amount));
  const [cooldownDays, setCooldownDays] = useState(reward.cooldownDays ? String(reward.cooldownDays) : "");
  const [active, setActive] = useState(reward.active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseInt(amount, 10);
    if (!name || !amount || amountNum < 1) {
      setError("Name and amount are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(API_ROUTES.GEMS.REWARDS_UPDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reward.id,
          name: name !== reward.name ? name : undefined,
          description: description !== (reward.description || "") ? (description || null) : undefined,
          amount: amountNum !== reward.amount ? amountNum : undefined,
          active: active !== reward.active ? active : undefined,
          cooldownDays: cooldownDays ? parseInt(cooldownDays, 10) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update reward");
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
      >
        Edit
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Gem Reward">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Reward Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 outline-none focus:border-blue-500"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Amount (gems)</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">Cooldown (days)</label>
              <input
                type="number"
                min={0}
                value={cooldownDays}
                onChange={(e) => setCooldownDays(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-purple-600"
            />
            <span className="text-sm text-zinc-300">Active</span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <ActionButton variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </ActionButton>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
