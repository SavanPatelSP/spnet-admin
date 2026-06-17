"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";

interface GemReward {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  category: string;
  active: boolean;
  cooldownDays: number | null;
  maxClaims: number | null;
  budget: number | null;
  icon: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface RewardCampaignEditorProps {
  reward?: GemReward;
  trigger?: React.ReactNode;
}

export default function RewardCampaignEditor({ reward, trigger }: RewardCampaignEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(reward?.name || "");
  const [description, setDescription] = useState(reward?.description || "");
  const [amount, setAmount] = useState(reward?.amount || 100);
  const [category, setCategory] = useState(reward?.category || "ACHIEVEMENT");
  const [active, setActive] = useState(reward?.active ?? true);
  const [cooldownDays, setCooldownDays] = useState(reward?.cooldownDays?.toString() || "");
  const [maxClaims, setMaxClaims] = useState(reward?.maxClaims?.toString() || "");
  const [budget, setBudget] = useState(reward?.budget?.toString() || "");
  const [icon, setIcon] = useState(reward?.icon || "");
  const [startDate, setStartDate] = useState(reward?.startDate?.split("T")[0] || "");
  const [endDate, setEndDate] = useState(reward?.endDate?.split("T")[0] || "");

  const isEditing = !!reward;

  async function handleSave() {
    if (!name || amount < 1) {
      setError("Name and amount (>= 1) are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const body = {
        name,
        description: description || null,
        amount,
        category,
        active,
        cooldownDays: cooldownDays ? Number(cooldownDays) : null,
        maxClaims: maxClaims ? Number(maxClaims) : null,
        budget: budget ? Number(budget) : null,
        icon: icon || null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      };

      const url = isEditing ? "/api/gems/rewards/update" : "/api/gems/rewards/create";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { ...body, id: reward.id } : body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save reward");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to save reward");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <ActionButton onClick={() => setOpen(true)} variant="primary" size="sm">
          {isEditing ? "Edit Campaign" : "New Campaign"}
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEditing ? `Edit Campaign: ${reward.name}` : "Create Reward Campaign"}
        description="Set up a gem reward with campaign scheduling, budgets, and claim limits."
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Campaign" : "Create Campaign"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Bonus"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Amount (gems)</label>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Campaign description..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500">
                {["ACHIEVEMENT", "REFERRAL", "EVENT", "SEASONAL"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Icon (emoji or URL)</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. 🎉 or /icons/gem.png"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Cooldown (days)</label>
              <input type="number" min="0" value={cooldownDays} onChange={(e) => setCooldownDays(e.target.value)} placeholder="Optional"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Max Claims</label>
              <input type="number" min="0" value={maxClaims} onChange={(e) => setMaxClaims(e.target.value)} placeholder="Unlimited"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Budget</label>
              <input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Unlimited"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500" />
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500" />
            <span className="text-sm text-zinc-400">Active (available for claiming)</span>
          </label>
        </div>
      </Modal>
    </>
  );
}
