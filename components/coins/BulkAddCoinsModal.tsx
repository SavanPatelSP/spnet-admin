"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { Coins, CheckCircle, XCircle } from "lucide-react";

interface BulkAddCoinsModalProps {
  licenseIds: string[];
  onClose: () => void;
}

export default function BulkAddCoinsModal({ licenseIds, onClose }: BulkAddCoinsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<{ licenseId: string; ok: boolean; error?: string }[]>([]);

  const totalCoins = amount * licenseIds.length;
  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  async function handleAdd() {
    setError("");
    if (amount < 1) { setError("Amount must be at least 1"); return; }
    setLoading(true);
    setResults([]);

    const batchResults: { licenseId: string; ok: boolean; error?: string }[] = [];

    for (const licenseId of licenseIds) {
      try {
        const res = await fetch(API_ROUTES.COINS.BULK_ADD, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ licenseIds: [licenseId], amount, reason: reason || null, description: description || null }),
        });
        const data = await res.json();
        batchResults.push({ licenseId, ok: res.ok, error: res.ok ? undefined : data.error });
      } catch {
        batchResults.push({ licenseId, ok: false, error: "Network error" });
      }
    }

    setResults(batchResults);

    const allOk = batchResults.every((r) => r.ok);
    if (allOk) {
      onClose();
      router.refresh();
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Bulk Add Coins"
      description={`Add coins to ${licenseIds.length} license${licenseIds.length !== 1 ? "s" : ""}.`}
      size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleAdd} disabled={loading}>
            {loading
              ? `Processing (${succeeded + failed}/${licenseIds.length})...`
              : `Add to ${licenseIds.length} License${licenseIds.length !== 1 ? "s" : ""}`}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Results after processing */}
        {results.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-sm font-semibold text-zinc-100">Results</h4>
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">{succeeded} succeeded</span>
              {failed > 0 && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">{failed} failed</span>
              )}
            </div>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {results.map((r) => (
                <div key={r.licenseId} className="flex items-center gap-2 text-xs">
                  {r.ok
                    ? <CheckCircle size={12} className="shrink-0 text-green-400" />
                    : <XCircle size={12} className="shrink-0 text-red-400" />}
                  <code className="text-zinc-400">{r.licenseId}</code>
                  {!r.ok && <span className="text-red-400">{r.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Review */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">Review Selection</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="text-zinc-500">Licenses Selected</div>
            <div className="font-medium text-zinc-100">{licenseIds.length}</div>
            <div className="text-zinc-500">Total Coins to Distribute</div>
            <div className="flex items-center gap-1.5 font-medium text-zinc-100">
              <Coins size={14} className="text-zinc-400" />
              {totalCoins.toLocaleString()} ({amount.toLocaleString()} × {licenseIds.length})
            </div>
          </div>
        </div>

        {/* Step 2: Amount */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
            <h4 className="text-sm font-semibold text-zinc-100">Amount per License</h4>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Amount</label>
            <input
              type="number" min="1" value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description (optional)</label>
            <textarea
              placeholder="Additional details..." value={description}
              onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
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
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Reason <span className="text-red-400">*</span></label>
            <input
              type="text" placeholder="e.g. Bulk bonus credit" value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Impact Summary */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Coins size={14} className="text-zinc-400" />
            <h4 className="text-sm font-semibold text-zinc-100">Impact Summary</h4>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Per License</span>
              <span className="font-medium text-green-400">+{amount.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-zinc-400">Total Across All Licenses</span>
              <span className="font-medium text-green-400">+{totalCoins.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Licenses</span>
              <span className="text-zinc-300">{licenseIds.length}</span>
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
              <span className="text-yellow-400">COINS_BULK_GRANTED</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Licenses</span>
              <span className="text-zinc-300">{licenseIds.length}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Per License</span>
              <span className="text-green-400">+{amount.toLocaleString()}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Total</span>
              <span className="text-green-400">+{totalCoins.toLocaleString()}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Reason</span>
              <span className="text-zinc-300">{reason || <span className="text-zinc-600">(not set)</span>}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
