"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { Plus } from "lucide-react";
import { API_ROUTES } from "@/lib/constants";

interface Props {
  onSuccess?: () => void;
}

export default function CreateRewardModal({ onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [cooldownDays, setCooldownDays] = useState("");
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
      const res = await fetch(API_ROUTES.GEMS.REWARDS_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          amount: amountNum,
          cooldownDays: cooldownDays ? parseInt(cooldownDays, 10) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create reward");
      } else {
        setOpen(false);
        setName("");
        setDescription("");
        setAmount("");
        setCooldownDays("");
        router.refresh();
        onSuccess?.();
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
        className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
      >
        <Plus size={16} /> Create Reward
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Gem Reward">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Reward Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 outline-none focus:border-blue-500"
              placeholder="e.g., Welcome Bonus"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 outline-none focus:border-blue-500"
              placeholder="Optional description"
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
                placeholder="100"
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
                placeholder="Optional"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3">
            <ActionButton variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </ActionButton>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              Create Reward
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
