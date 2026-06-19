"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, COIN_PACKAGES } from "@/lib/constants";
import { Coins, Wallet, TrendingUp, Package, ShoppingCart, ArrowRight, Sparkles } from "lucide-react";

function fmt(n: number) { return n.toLocaleString(); }

function estimateCoinValue(amount: number): number {
  if (amount <= 0) return 0;
  const sorted = [...COIN_PACKAGES].sort((a, b) => a.amount - b.amount);
  if (amount <= sorted[0].amount) {
    return Math.round((amount / sorted[0].amount) * sorted[0].price);
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const low = sorted[i];
    const high = sorted[i + 1];
    if (amount >= low.amount && amount <= high.amount) {
      const t = (amount - low.amount) / (high.amount - low.amount);
      return Math.round(low.price + t * (high.price - low.price));
    }
  }
  const last = sorted[sorted.length - 1];
  return Math.round((amount / last.amount) * last.price);
}

interface AddCoinsModalProps {
  licenseId: string;
  organization: string;
  currentBalance?: number;
  autoOpen?: boolean;
}

export default function AddCoinsModal({ licenseId, organization, currentBalance = 0, autoOpen }: AddCoinsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(1000);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const afterBalance = currentBalance + amount;
  const pctChange = currentBalance > 0 ? ((afterBalance - currentBalance) / currentBalance) * 100 : 100;
  const selectedPkg = COIN_PACKAGES.find((p) => p.amount === amount);
  const estimatedValue = useMemo(() => estimateCoinValue(amount), [amount]);
  const isCustomAmount = !COIN_PACKAGES.some((p) => p.amount === amount);

  async function handleAdd() {
    setError("");
    if (amount < 1) { setError("Amount must be at least 1"); return; }
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.COINS.ADD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, amount, reason: reason || null, description: description || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to add coins"); return; }
      setOpen(false);
      setAmount(1000);
      setReason("");
      setDescription("");
      router.refresh();
    } catch {
      setError("Failed to add coins");
    } finally { setLoading(false); }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="primary" size="sm">
        <Coins size={14} /> Grant
      </ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Grant Coins"
        description={`Add coins to ${organization}.`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleAdd} disabled={loading || amount < 1}>
              {loading ? "Granting..." : "Grant Coins"}
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
              <div className="text-zinc-500">Current Coins</div>
              <div className="flex items-center gap-1.5 font-medium text-amber-400">
                <Coins size={14} className="text-amber-400" />
                {fmt(currentBalance)}
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
              {COIN_PACKAGES.map((pkg) => (
                <button
                  key={pkg.amount}
                  type="button"
                  onClick={() => setAmount(pkg.amount)}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    amount === pkg.amount && !isCustomAmount
                      ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }`}
                >
                  <Package size={14} className="mx-auto mb-1 text-amber-400" />
                  <div className="text-sm font-medium text-zinc-200">{pkg.label}</div>
                  <div className="text-xs text-zinc-500">{fmt(pkg.amount)}</div>
                  <div className="mt-0.5 text-[10px] font-medium text-amber-400">{pkg.currency}{pkg.price.toLocaleString()}</div>
                  <div className="text-[9px] text-zinc-600">value</div>
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <Wallet className="mr-1 inline" size={12} />
                Custom Amount
              </label>
              <input
                type="number" min="1" value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500"
              />
              {amount > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <ShoppingCart size={11} className="text-zinc-500" />
                  Estimated value: <span className="font-medium text-amber-400">₹{estimatedValue.toLocaleString()}</span>
                  {isCustomAmount && estimatedValue > 0 && (
                    <span className="text-zinc-600">({fmt(amount)} coins at ~₹{(estimatedValue / amount).toFixed(2)}/coin)</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Step 3: Reason */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Reason</h4>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Reason <span className="text-red-400">*</span></label>
              <input
                type="text" placeholder="e.g. Purchase credit, Bonus reward" value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-500"
              />
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description (optional)</label>
              <textarea
                placeholder="Additional details..." value={description}
                onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Step 4: Impact Summary */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">4</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-amber-300">
                <TrendingUp size={14} />
                Impact Summary
              </h4>
            </div>

            {/* Before / After */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                <div className="mb-2 text-xs font-medium text-zinc-500">Current Balance</div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                  <Coins size={14} className="text-zinc-500" />
                  {fmt(currentBalance)}
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="mb-2 text-xs font-medium text-amber-400">New Balance</div>
                <div className="flex items-center gap-1.5 text-lg font-bold text-amber-300">
                  <Coins size={16} className="text-amber-400" />
                  {fmt(afterBalance)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-300">
                    <Sparkles size={14} className="text-green-400" />
                    Granted
                  </span>
                  <span className="font-semibold text-green-400">+{fmt(amount)} coins</span>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Balance change</span>
                  <span className="text-xs text-green-400">+{pctChange.toFixed(1)}%</span>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Estimated value</span>
                  <span className="text-xs font-medium text-amber-400">₹{estimatedValue.toLocaleString()}</span>
                </div>
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
                <span className="text-yellow-400">COINS_ADDED</span>
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
                <span className="text-amber-400">{fmt(afterBalance)}</span>
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
                <span className="w-28 text-zinc-500">Reason</span>
                <span className="text-zinc-300">{reason || <span className="text-zinc-600">(not set)</span>}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
