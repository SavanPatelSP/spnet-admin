"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { Gem, TrendingDown, Users, AlertTriangle } from "lucide-react";

interface BulkRevokeGemsModalProps {
  licenseIds: string[];
  onClose: () => void;
}

export default function BulkRevokeGemsModal({ licenseIds, onClose }: BulkRevokeGemsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  const totalGems = amount * licenseIds.length;
  const [result, setResult] = useState<{ success: number; skipped: number } | null>(null);

  async function handleRevoke() {
    setError("");
    setResult(null);
    if (amount < 1) { setError("Amount must be at least 1"); return; }
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.GEMS.BULK_REVOKE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseIds, amount, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to revoke gems");
        return;
      }
      if (data.skipped > 0) {
        setResult({ success: data.count || 0, skipped: data.skipped });
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Failed to revoke gems");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Bulk Revoke Gems"
      description={`Revoke gems from ${licenseIds.length} license${licenseIds.length !== 1 ? "s" : ""}.`}
      size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="danger" onClick={handleRevoke} loading={loading}>
            Revoke from {licenseIds.length} Licenses
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {result && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>{result.skipped} license{result.skipped !== 1 ? "s" : ""} skipped due to insufficient balance. {result.success} succeeded.</span>
            </div>
          </div>
        )}

        {/* Step 1: License Summary */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">License Summary</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="text-zinc-500">Total Licenses</div>
            <div className="flex items-center gap-1.5 font-medium text-zinc-100">
              <Users size={14} className="text-zinc-400" />
              {licenseIds.length.toLocaleString()}
            </div>
            <div className="text-zinc-500">License IDs</div>
            <div className="max-h-24 overflow-y-auto">
              {licenseIds.map((id) => (
                <code key={id} className="block text-xs text-zinc-400">{id}</code>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Configure Revocation */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
            <h4 className="text-sm font-semibold text-zinc-100">Configure Revocation</h4>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Amount per License</label>
            <input
              type="number" min="1" value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-zinc-500">Licenses with insufficient balance will be skipped.</p>
          </div>
        </div>

        {/* Step 3: Reason */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
            <h4 className="text-sm font-semibold text-zinc-100">Reason</h4>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Revocation Reason</label>
            <input
              type="text" placeholder="e.g. Penalty, Expired bonus" value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* License Count & Impact Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="mb-2 text-xs font-medium text-zinc-500">Per License</div>
            <div className="flex items-center gap-1.5 text-sm text-zinc-300">
              <Gem size={14} className="text-red-400" />
              -{amount.toLocaleString()} gems
            </div>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <div className="mb-2 text-xs font-medium text-red-400">Total Revocation</div>
            <div className="flex items-center gap-1.5 text-sm text-red-300">
              <TrendingDown size={14} className="text-red-400" />
              {totalGems.toLocaleString()} gems across {licenseIds.length} license{licenseIds.length !== 1 ? "s" : ""}
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
              <span className="text-red-400">BULK_REVOKE</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Licenses</span>
              <span className="text-zinc-300">{licenseIds.length.toLocaleString()}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Per License</span>
              <span className="text-red-400">-{amount.toLocaleString()}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Total</span>
              <span className="text-zinc-300">{totalGems.toLocaleString()} gems</span>
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
