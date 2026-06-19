"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, GEM_PACKAGES } from "@/lib/constants";
import { Gem, TrendingUp, Crown, ArrowRight, Sparkles, ShoppingCart, Shield, Zap, Diamond } from "lucide-react";

function fmt(n: number) { return n.toLocaleString(); }

function estimateGemValue(amount: number): number {
  if (amount <= 0) return 0;
  const sorted = [...GEM_PACKAGES].sort((a, b) => a.amount - b.amount);
  if (amount <= sorted[0].amount) return Math.round((amount / sorted[0].amount) * sorted[0].price);
  for (let i = 0; i < sorted.length - 1; i++) {
    const low = sorted[i], high = sorted[i + 1];
    if (amount >= low.amount && amount <= high.amount) {
      const t = (amount - low.amount) / (high.amount - low.amount);
      return Math.round(low.price + t * (high.price - low.price));
    }
  }
  const last = sorted[sorted.length - 1];
  return Math.round((amount / last.amount) * last.price);
}

interface GemRewardOption {
  id: string;
  name: string;
  amount: number;
  description: string | null;
}

interface GrantGemsModalProps {
  licenseId: string;
  organization: string;
  currentBalance?: number;
  rewards?: GemRewardOption[];
  autoOpen?: boolean;
}

export default function GrantGemsModal({ licenseId, organization, currentBalance = 0, rewards = [], autoOpen }: GrantGemsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(100);
  const [rewardId, setRewardId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const newBalance = currentBalance + amount;
  const pctChange = currentBalance > 0 ? ((newBalance - currentBalance) / currentBalance) * 100 : 100;
  const selectedPkg = GEM_PACKAGES.find((p) => p.amount === amount);
  const isCustomAmount = !GEM_PACKAGES.some((p) => p.amount === amount) && !rewardId;
  const estimatedValue = useMemo(() => estimateGemValue(amount), [amount]);
  const premiumEligible = amount >= 100;
  const licenseEligible = amount >= 50;

  async function handleGrant() {
    setError("");
    if (amount < 1) { setError("Amount must be at least 1"); return; }
    setLoading(true);
    try {
      const body: Record<string, unknown> = { licenseId, amount };
      if (rewardId) body.rewardId = rewardId;
      if (reason) body.reason = reason;
      if (description) body.description = description;
      const res = await fetch(API_ROUTES.GEMS.GRANT, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to grant gems"); return; }
      setOpen(false);
      setAmount(100);
      setRewardId("");
      setReason("");
      setDescription("");
      router.refresh();
    } catch { setError("Failed to grant gems"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="primary" size="sm">
        <Gem size={14} /> Grant
      </ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Grant Gems"
        description={`Grant premium gems to ${organization}.`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleGrant} disabled={loading || amount < 1}>
              {loading ? "Granting..." : "Grant Gems"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-6">
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          {/* Step 1: Current Balance */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Current Balance</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <div className="text-zinc-500">Organization</div>
              <div className="font-medium text-zinc-100">{organization}</div>
              <div className="text-zinc-500">License ID</div>
              <code className="text-zinc-300 text-xs">{licenseId}</code>
              <div className="text-zinc-500">Current Gems</div>
              <div className="flex items-center gap-1.5 font-medium text-purple-400">
                <Gem size={14} className="text-purple-400" />
                {fmt(currentBalance)}
              </div>
              <div className="text-zinc-500">Currency Type</div>
              <div className="flex items-center gap-1.5 text-xs">
                <Crown size={12} className="text-yellow-400" />
                <span className="text-yellow-400 font-medium">Premium</span>
                <span className="text-zinc-600">&middot; Can purchase Premium &amp; Licenses</span>
              </div>
            </div>
          </div>

          {/* Step 2: Select Package */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Select Package</h4>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-2">
              {GEM_PACKAGES.map((pkg) => (
                <button
                  key={pkg.amount}
                  type="button"
                  onClick={() => { setAmount(pkg.amount); setRewardId(""); }}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    amount === pkg.amount && !rewardId
                      ? "border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/20"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }`}
                >
                  <Sparkles size={14} className="mx-auto mb-1 text-purple-400" />
                  <div className="text-sm font-medium text-zinc-200">{pkg.label}</div>
                  <div className="text-xs text-zinc-500">{fmt(pkg.amount)}</div>
                  <div className="mt-0.5 text-[10px] font-medium text-purple-400">{pkg.currency}{pkg.price.toLocaleString()}</div>
                  <div className="text-[9px] text-zinc-600">{pkg.description}</div>
                </button>
              ))}
            </div>

            {rewards.length > 0 && (
              <div className="mb-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Diamond size={12} className="text-purple-400" />
                  Use Reward Template
                </label>
                <select
                  value={rewardId}
                  onChange={(e) => { setRewardId(e.target.value); const r = rewards.find((r) => r.id === e.target.value); if (r) setAmount(r.amount); }}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-purple-500"
                >
                  <option value="">Custom amount...</option>
                  {rewards.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.amount} gems)</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <Zap size={12} className="text-purple-400" />
                Custom Amount
              </label>
              <input
                type="number" min="1" value={amount}
                onChange={(e) => { setAmount(Number(e.target.value)); setRewardId(""); }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-purple-500"
              />
              {amount > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <ShoppingCart size={11} className="text-zinc-500" />
                  Estimated value: <span className="font-medium text-purple-400">₹{estimatedValue.toLocaleString()}</span>
                  {isCustomAmount && estimatedValue > 0 && (
                    <span className="text-zinc-600">({fmt(amount)} gems at ~₹{(estimatedValue / amount).toFixed(2)}/gem)</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Step 3: Reason & Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Reason &amp; Notes</h4>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Reason</label>
              <input type="text" placeholder="e.g. Achievement, Bonus" value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-purple-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description (optional)</label>
              <textarea placeholder="Additional details..." value={description}
                onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-purple-500" />
            </div>
          </div>

          {/* Step 4: Impact & Purchasing Power */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">4</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-purple-300">
                <TrendingUp size={14} />
                Impact &amp; Purchasing Power
              </h4>
            </div>

            {/* Balance Flow */}
            <div className="mb-4 space-y-2">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Current Gems</span>
                  <span className="flex items-center gap-1 text-sm text-zinc-300">
                    <Gem size={12} className="text-zinc-500" />
                    {fmt(currentBalance)}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <Sparkles size={12} className="text-green-400" />
                    Granting
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-green-400">
                    <ArrowRight size={12} />
                    +{fmt(amount)} gems
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-purple-400">New Balance</span>
                  <span className="flex items-center gap-1 text-lg font-bold text-purple-300">
                    <Gem size={16} className="text-purple-400" />
                    {fmt(newBalance)}
                  </span>
                </div>
              </div>
              {currentBalance > 0 && (
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Balance increase</span>
                    <span className="text-green-400">+{pctChange.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Estimated Value */}
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5">
              <ShoppingCart size={14} className="text-purple-400" />
              <span className="text-xs text-zinc-400">
                Estimated value: <strong className="text-purple-400">₹{estimatedValue.toLocaleString()}</strong>
              </span>
              <span className="text-[10px] text-zinc-600">
                {fmt(amount)} gems at ~₹{(estimatedValue / Math.max(amount, 1)).toFixed(2)}/gem
              </span>
            </div>

            {/* Purchasing Power */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg border p-3 ${
                premiumEligible ? "border-yellow-500/30 bg-yellow-500/10" : "border-zinc-700 bg-zinc-800/50"
              }`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Crown size={14} className={premiumEligible ? "text-yellow-400" : "text-zinc-500"} />
                  <span className={`text-xs font-medium ${premiumEligible ? "text-yellow-400" : "text-zinc-500"}`}>
                    Premium Purchasing Power
                  </span>
                  {premiumEligible && (
                    <span className="ml-auto rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-medium text-yellow-400">Eligible</span>
                  )}
                </div>
                <p className={`text-xs ${premiumEligible ? "text-yellow-200/70" : "text-zinc-500"}`}>
                  {premiumEligible
                    ? `${fmt(amount)} gems can purchase or upgrade a Premium subscription`
                    : `${fmt(amount)} gems contribute towards a Premium subscription (min. 100 gems)`}
                </p>
              </div>
              <div className={`rounded-lg border p-3 ${
                licenseEligible ? "border-blue-500/30 bg-blue-500/10" : "border-zinc-700 bg-zinc-800/50"
              }`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield size={14} className={licenseEligible ? "text-blue-400" : "text-zinc-500"} />
                  <span className={`text-xs font-medium ${licenseEligible ? "text-blue-400" : "text-zinc-500"}`}>
                    License Purchasing Power
                  </span>
                  {licenseEligible && (
                    <span className="ml-auto rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-medium text-blue-400">Eligible</span>
                  )}
                </div>
                <p className={`text-xs ${licenseEligible ? "text-blue-200/70" : "text-zinc-500"}`}>
                  {licenseEligible
                    ? `${fmt(amount)} gems can be used to acquire or extend a license`
                    : `${fmt(amount)} gems contribute towards licensing (min. 50 gems)`}
                </p>
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
                <span className="w-28 text-zinc-500">Action</span>
                <span className="text-yellow-400">GEMS_GRANTED</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Organization</span>
                <span className="text-zinc-300">{organization}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">License</span>
                <span className="text-zinc-300">{licenseId}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Amount</span>
                <span className="text-green-400">+{fmt(amount)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Before</span>
                <span className="text-zinc-300">{fmt(currentBalance)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">After</span>
                <span className="text-purple-400">{fmt(newBalance)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Change</span>
                <span className="text-green-400">+{pctChange.toFixed(1)}%</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Value</span>
                <span className="text-zinc-300">₹{estimatedValue.toLocaleString()}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Premium Power</span>
                <span className={premiumEligible ? "text-yellow-400" : "text-zinc-600"}>{premiumEligible ? "Eligible" : "Insufficient"}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">License Power</span>
                <span className={licenseEligible ? "text-blue-400" : "text-zinc-600"}>{licenseEligible ? "Eligible" : "Insufficient"}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Reason</span>
                <span className="text-zinc-300">{reason || <span className="text-zinc-600">(not set)</span>}</span>
              </div>
              {description && (
                <div className="flex">
                  <span className="w-28 text-zinc-500">Notes</span>
                  <span className="text-zinc-300">{description}</span>
                </div>
              )}
              {rewardId && (
                <div className="flex">
                  <span className="w-28 text-zinc-500">Reward</span>
                  <span className="text-zinc-300">{rewards.find((r) => r.id === rewardId)?.name || rewardId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
