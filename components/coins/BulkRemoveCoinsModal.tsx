"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";

interface BulkRemoveCoinsModalProps {
  licenseIds: string[];
  onClose: () => void;
}

export default function BulkRemoveCoinsModal({ licenseIds, onClose }: BulkRemoveCoinsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  async function handleRemove() {
    setError("");
    if (amount < 1) { setError("Amount must be at least 1"); return; }
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.COINS.BULK_REMOVE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseIds, amount, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to remove coins");
        return;
      }
      if (data.skipped > 0) {
        setError(`${data.skipped} license${data.skipped !== 1 ? "s" : ""} skipped due to insufficient balance. ${data.count} succeeded.`);
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Failed to remove coins");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Bulk Remove Coins"
      description={`Remove coins from ${licenseIds.length} license${licenseIds.length !== 1 ? "s" : ""}. Licenses with insufficient balance will be skipped.`}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="danger" onClick={handleRemove} loading={loading}>
            Remove from {licenseIds.length} Licenses
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Amount per License</label>
          <input
            type="number" min="1" value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-400">Reason</label>
          <input
            type="text" placeholder="e.g. Penalty, Adjustment" value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}
