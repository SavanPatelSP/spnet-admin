"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, COIN_PACKAGES } from "@/lib/constants";
import { Coins, Wallet, TrendingDown, AlertTriangle, ArrowRight, MinusCircle, ShoppingCart } from "lucide-react";

function fmt(n: number) { return n.toLocaleString(); }

function estimateCoinValue(amount: number): number {
  if (amount <= 0) return 0;
  const sorted = [...COIN_PACKAGES].sort((a, b) => a.amount - b.amount);
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

interface RemoveCoinsModalProps {
  licenseId: string;
  organization: string;
  currentBalance: number;
  autoOpen?: boolean;
}

export default function RemoveCoinsModal({ licenseId, organization, currentBalance, autoOpen }: RemoveCoinsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const afterBalance = currentBalance - amount;
  const pctChange = currentBalance > 0 ? ((afterBalance - currentBalance) / currentBalance) * 100 : 0;
  const exceeds = amount > currentBalance;
  const estimatedValue = useMemo(() => estimateCoinValue(amount), [amount]);

  async function handleRemove() {
    setError("");
    if (amount < 1) { setError("Amount must be at least 1"); return; }
    if (exceeds) { setError(`Amount exceeds current balance (${fmt(currentBalance)})`); return; }
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.COINS.REMOVE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, amount, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to remove coins"); return; }
      setOpen(false);
      setAmount(0);
      setReason("");
      setConfirmed(false);
      router.refresh();
    } catch {
      setError("Failed to remove coins");
    } finally { setLoading(false); }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="danger" size="sm">
        <MinusCircle size={14} /> Remove
      </ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Remove Coins"
        description={`Remove coins from ${organization}. This will decrease their balance.`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="danger" onClick={handleRemove} disabled={loading || amount < 1 || exceeds || !confirmed}>
              {loading ? "Removing..." : "Remove Coins"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-6">
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          {/* Step 1: Current State */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Current State</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <div className="text-zinc-500">Organization</div>
              <div className="font-medium text-zinc-100">{organization}</div>
              <div className="text-zinc-500">License ID</div>
              <code className="text-zinc-300 text-xs">{licenseId}</code>
              <div className="text-zinc-500">Current Balance</div>
              <div className="flex items-center gap-1.5 font-medium text-amber-400">
                <Coins size={14} className="text-amber-400" />
                {fmt(currentBalance)}
              </div>
            </div>
          </div>

          {/* Step 2: Amount to Remove */}
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">2</span>
              <h4 className="text-sm font-semibold text-orange-300">Amount to Remove</h4>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Amount</label>
              <input
                type="number" min="1" max={currentBalance} value={amount}
                onChange={(e) => { setAmount(Number(e.target.value)); setConfirmed(false); }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-orange-500"
              />
              <p className="mt-1.5 text-xs text-zinc-500">
                Available balance: <span className="text-amber-400">{fmt(currentBalance)}</span> coins
                {exceeds && <span className="ml-2 text-red-400">Amount exceeds available balance</span>}
              </p>
              {amount > 0 && !exceeds && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-orange-500/10 bg-orange-500/5 px-3 py-2 text-xs">
                  <ShoppingCart size={11} className="text-zinc-500" />
                  Estimated value of removed coins: <span className="font-medium text-orange-400">₹{estimatedValue.toLocaleString()}</span>
                </div>
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
                type="text" placeholder="e.g. Penalty, Adjustment" value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Step 4: Impact */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400">4</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-red-300">
                <TrendingDown size={14} />
                Impact Summary
              </h4>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                <div className="mb-2 text-xs font-medium text-zinc-500">Before</div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                  <Coins size={14} className="text-zinc-500" />
                  {fmt(currentBalance)}
                </div>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div className="mb-2 text-xs font-medium text-red-400">After</div>
                <div className="flex items-center gap-1.5 text-sm text-red-300">
                  <Coins size={14} className="text-red-400" />
                  {fmt(afterBalance)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg border border-red-500/10 bg-red-500/5 px-4 py-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <MinusCircle size={14} className="text-red-400" />
                    Removed
                  </span>
                  <span className="font-semibold text-red-400">-{fmt(amount)} coins</span>
                </div>
              </div>
              {currentBalance > 0 && amount > 0 && (
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Balance change</span>
                    <span className="text-red-400">{pctChange.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <div>
                  <p className="text-xs font-medium text-red-300">Confirmation Required</p>
                  <p className="mt-1 text-xs text-red-200/70">
                    This will permanently remove {fmt(amount)} coins from {organization}. This action cannot be undone.
                  </p>
                  <label className="mt-2 flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500"
                    />
                    <span className="text-xs text-zinc-400">
                      I confirm removing {fmt(amount)} coins from {organization}.
                    </span>
                  </label>
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
                <span className="text-yellow-400">COINS_REMOVED</span>
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
                <span className="text-red-400">-{fmt(amount)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Before</span>
                <span className="text-zinc-300">{fmt(currentBalance)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">After</span>
                <span className="text-red-400">{fmt(afterBalance)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Change</span>
                <span className="text-red-400">{pctChange.toFixed(1)}%</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Value Lost</span>
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
