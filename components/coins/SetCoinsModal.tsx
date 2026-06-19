"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, COIN_PACKAGES } from "@/lib/constants";
import { Coins, Wallet, ArrowRight, TrendingUp, ShoppingCart, SlidersHorizontal } from "lucide-react";

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

interface SetCoinsModalProps {
  licenseId: string;
  organization: string;
  currentBalance: number;
  autoOpen?: boolean;
}

export default function SetCoinsModal({ licenseId, organization, currentBalance, autoOpen }: SetCoinsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(currentBalance);
  const [type, setType] = useState("FINITE");
  const [reason, setReason] = useState("");

  const diff = balance - currentBalance;
  const isIncrease = diff > 0;
  const isDecrease = diff < 0;
  const pctChange = currentBalance > 0 ? ((balance - currentBalance) / currentBalance) * 100 : 0;
  const diffValue = useMemo(() => estimateCoinValue(Math.abs(diff)), [diff]);
  const newValue = useMemo(() => estimateCoinValue(balance), [balance]);

  async function handleSet() {
    if (balance < 0) { setError("Balance must be non-negative"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.COINS.SET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, balance, type, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to set coin balance"); return; }
      setOpen(false);
      router.refresh();
    } catch { setError("Failed to set coin balance"); }
    finally { setLoading(false); }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="secondary" size="sm">
        <SlidersHorizontal size={14} /> Set
      </ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Set Coin Balance"
        description={`Set exact coin balance for ${organization}.`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleSet} disabled={loading}>
              {loading ? "Setting..." : "Set Balance"}
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
              <div className="text-zinc-500">Current Value</div>
              <div className="text-xs text-zinc-400">₹{estimateCoinValue(currentBalance).toLocaleString()}</div>
            </div>
          </div>

          {/* Step 2: New Configuration */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">2</span>
              <h4 className="text-sm font-semibold text-blue-300">New Configuration</h4>
            </div>

            {/* Before / After Comparison */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                <div className="mb-2 text-xs font-medium text-zinc-500">Current</div>
                <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                  <Coins size={14} className="text-zinc-500" />
                  {fmt(currentBalance)}
                </div>
              </div>
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                <div className="mb-2 text-xs font-medium text-blue-400">New</div>
                <div className="flex items-center gap-1.5 text-lg font-bold text-blue-300">
                  <Coins size={16} className="text-blue-400" />
                  {fmt(balance)}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">New Balance</label>
              <input type="number" min="0" value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
              {diff !== 0 && (
                <p className="mt-1 text-xs text-zinc-500">
                  {isIncrease ? `+${fmt(diff)}` : fmt(diff)} from current balance
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Coin Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500">
                {["FINITE", "PROMOTIONAL", "BONUS"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Step 3: Reason */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Reason</h4>
            </div>
            <input type="text" placeholder="Reason for setting balance..." value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
          </div>

          {/* Step 4: Impact Summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">4</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <TrendingUp size={14} />
                Impact Summary
              </h4>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Current Balance</span>
                  <span className="text-sm text-zinc-300">{fmt(currentBalance)}</span>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">New Balance</span>
                  <span className="text-lg font-bold text-blue-400">{fmt(balance)}</span>
                </div>
              </div>
              {diff !== 0 && (
                <>
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Difference</span>
                      <span className={isIncrease ? "text-green-400" : "text-red-400"}>
                        {isIncrease ? "+" : ""}{fmt(diff)} ({isIncrease ? "+" : ""}{pctChange.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Value Impact</span>
                      <span className={isIncrease ? "text-green-400" : "text-red-400"}>
                        {isIncrease ? "+" : "-"}₹{diffValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Total Value</span>
                  <span className="text-amber-400">₹{newValue.toLocaleString()}</span>
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
                <span className="text-yellow-400">COINS_SET</span>
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
                <span className="w-28 text-zinc-500">Previous</span>
                <span className="text-zinc-300">{fmt(currentBalance)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">New Balance</span>
                <span className="text-blue-400">{fmt(balance)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Diff</span>
                <span className={isIncrease ? "text-green-400" : isDecrease ? "text-red-400" : "text-zinc-300"}>
                  {diff === 0 ? "\u2014" : `${isIncrease ? "+" : ""}${fmt(diff)} (${pctChange.toFixed(1)}%)`}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Type</span>
                <span className="text-zinc-300">{type}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Value</span>
                <span className="text-zinc-300">₹{newValue.toLocaleString()}</span>
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
