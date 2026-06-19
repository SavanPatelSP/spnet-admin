"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { Gift, Tag, Timer, Eye, ArrowRight } from "lucide-react";

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

const COOLDOWN_PRESETS = [
  { label: "None", days: 0 },
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
];

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

  const amountNum = parseInt(amount, 10) || 0;
  const hasChanges = name !== reward.name || description !== (reward.description || "") || amountNum !== reward.amount || cooldownDays !== (reward.cooldownDays ? String(reward.cooldownDays) : "") || active !== reward.active;

  async function handleSave() {
    if (!name || amountNum < 1) {
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
        return;
      }
      setOpen(false);
      router.refresh();
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

      <Modal
        open={open}
        onClose={() => { if (!loading) { setOpen(false); setError(""); } }}
        title="Edit Gem Reward"
        description={`Editing "${reward.name}"`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => { setOpen(false); setError(""); }} disabled={loading}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleSave} loading={loading} disabled={!hasChanges}>
              {loading ? "Saving..." : "Save Changes"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Current Values */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Current Values</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">Name</span>
                <p className="font-medium text-zinc-200">{reward.name}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">Amount</span>
                <p className="font-semibold text-purple-400">{reward.amount} gems</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">Cooldown</span>
                <p className="font-medium text-zinc-200">{reward.cooldownDays ? `${reward.cooldownDays} days` : "None"}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">Status</span>
                <p className={`font-medium ${reward.active ? "text-green-400" : "text-red-400"}`}>{reward.active ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </div>

          {/* Step 2: Edit Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Edit Configuration</h4>
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
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    <Timer className="mr-1 inline" size={12} />
                    Cooldown
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COOLDOWN_PRESETS.map((p) => (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => setCooldownDays(p.days === 0 ? "" : String(p.days))}
                        className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                          cooldownDays === String(p.days)
                            ? "border-purple-500 bg-purple-500/10 text-purple-400"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
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
            </div>
          </div>

          {/* Step 3: Changes & Audit */}
          {hasChanges && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                  <Eye size={14} />
                  Changes &amp; Audit
                </h4>
              </div>

              {hasChanges && (
                <div className="mb-4 space-y-2">
                  {name !== reward.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500">Name:</span>
                      <span className="text-zinc-500 line-through">{reward.name}</span>
                      <ArrowRight size={12} className="text-zinc-600" />
                      <span className="text-blue-400">{name}</span>
                    </div>
                  )}
                  {description !== (reward.description || "") && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500">Description:</span>
                      <span className="text-zinc-500 line-through">{reward.description || "(empty)"}</span>
                      <ArrowRight size={12} className="text-zinc-600" />
                      <span className="text-blue-400">{description || "(empty)"}</span>
                    </div>
                  )}
                  {amountNum !== reward.amount && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500">Amount:</span>
                      <span className="text-zinc-500 line-through">{reward.amount}</span>
                      <ArrowRight size={12} className="text-zinc-600" />
                      <span className="text-blue-400">{amountNum}</span>
                    </div>
                  )}
                  {cooldownDays !== (reward.cooldownDays ? String(reward.cooldownDays) : "") && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500">Cooldown:</span>
                      <span className="text-zinc-500 line-through">{reward.cooldownDays ? `${reward.cooldownDays}d` : "None"}</span>
                      <ArrowRight size={12} className="text-zinc-600" />
                      <span className="text-blue-400">{cooldownDays ? `${cooldownDays}d` : "None"}</span>
                    </div>
                  )}
                  {active !== reward.active && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500">Active:</span>
                      <span className="text-zinc-500 line-through">{reward.active ? "Yes" : "No"}</span>
                      <ArrowRight size={12} className="text-zinc-600" />
                      <span className="text-blue-400">{active ? "Yes" : "No"}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex">
                    <span className="w-28 text-zinc-500">Action</span>
                    <span className="text-yellow-400">REWARD_UPDATED</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-zinc-500">Reward ID</span>
                    <span className="text-zinc-300">{reward.id}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-zinc-500">Name</span>
                    <span className="text-zinc-300">{name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-zinc-500">Amount</span>
                    <span className="text-zinc-300">{amountNum} gems</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-zinc-500">Cooldown</span>
                    <span className="text-zinc-300">{cooldownDays ? `${cooldownDays} days` : "None"}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-zinc-500">Active</span>
                    <span className={active ? "text-green-400" : "text-zinc-500"}>{active ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
