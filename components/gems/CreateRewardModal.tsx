"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { Plus, Gift, Tag, Timer, Eye } from "lucide-react";
import { API_ROUTES } from "@/lib/constants";

interface Props {
  onSuccess?: () => void;
}

const COOLDOWN_PRESETS = [
  { label: "None", days: 0 },
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
];

export default function CreateRewardModal({ onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [cooldownDays, setCooldownDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amountNum = parseInt(amount, 10) || 0;
  const valid = name.trim().length > 0 && amountNum >= 1;

  async function handleCreate() {
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.GEMS.REWARDS_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          amount: amountNum,
          cooldownDays: cooldownDays ? parseInt(cooldownDays, 10) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create reward");
        return;
      }
      setOpen(false);
      setName("");
      setDescription("");
      setAmount("");
      setCooldownDays("");
      router.refresh();
      onSuccess?.();
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

      <Modal
        open={open}
        onClose={() => { if (!loading) { setOpen(false); setError(""); } }}
        title="Create Gem Reward"
        description="Define a new gem reward for your economy system."
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => { setOpen(false); setError(""); }} disabled={loading}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleCreate} loading={loading} disabled={!valid}>
              {loading ? "Creating..." : "Create Reward"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Basic Details */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Basic Details</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Tag className="mr-1 inline" size={12} />
                  Reward Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome Bonus"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of the reward..."
                  rows={2}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Reward Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Reward Configuration</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Gift className="mr-1 inline" size={12} />
                  Amount (gems) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Timer className="mr-1 inline" size={12} />
                  Cooldown Period
                </label>
                <div className="flex flex-wrap gap-2">
                  {COOLDOWN_PRESETS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => setCooldownDays(p.days === 0 ? "" : String(p.days))}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        cooldownDays === String(p.days)
                          ? "border-purple-500 bg-purple-500/10 text-purple-400"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {cooldownDays && parseInt(cooldownDays) > 0 && (
                  <p className="mt-1.5 text-xs text-zinc-500">
                    User must wait <strong className="text-zinc-400">{cooldownDays} day{parseInt(cooldownDays) !== 1 ? "s" : ""}</strong> before claiming again.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Review & Audit */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <Eye size={14} />
                Review &amp; Audit
              </h4>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Name</span>
                <p className="font-medium text-zinc-200">{name || <span className="text-zinc-600">(not set)</span>}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Amount</span>
                <p className="font-semibold text-purple-400">{amountNum > 0 ? `${amountNum} gems` : <span className="text-zinc-600">(not set)</span>}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Cooldown</span>
                <p className="font-medium text-zinc-200">{cooldownDays ? `${cooldownDays} days` : "None"}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Status</span>
                <p className="font-medium text-green-400">Active on creation</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex">
                  <span className="w-28 text-zinc-500">Action</span>
                  <span className="text-yellow-400">REWARD_CREATED</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Name</span>
                  <span className="text-zinc-300">{name || <span className="text-zinc-600">(not set)</span>}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Description</span>
                  <span className="text-zinc-300">{description || <span className="text-zinc-600">(not set)</span>}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Amount</span>
                  <span className="text-zinc-300">{amountNum > 0 ? `${amountNum} gems` : <span className="text-zinc-600">(not set)</span>}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Cooldown</span>
                  <span className="text-zinc-300">{cooldownDays ? `${cooldownDays} days` : "None"}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Active</span>
                  <span className="text-green-400">Yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
