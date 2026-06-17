"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";

interface RevokeGemsModalProps {
  licenseId: string;
  organization: string;
  currentBalance: number;
}

export default function RevokeGemsModal({ licenseId, organization, currentBalance }: RevokeGemsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  async function handleRevoke() {
    setError("");
    if (amount < 1) {
      setError("Amount must be at least 1");
      return;
    }
    if (amount > currentBalance) {
      setError(`Amount exceeds current balance (${currentBalance})`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.GEMS.REVOKE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, amount, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to revoke gems");
        return;
      }
      setOpen(false);
      setAmount(0);
      setReason("");
      router.refresh();
    } catch {
      setError("Failed to revoke gems");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="secondary" size="sm">
        Revoke
      </ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Revoke Gems"
        description={`Revoke gems from ${organization}. Current balance: ${currentBalance}`}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="danger" onClick={handleRevoke} disabled={loading}>
              {loading ? "Revoking..." : "Revoke Gems"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Amount</label>
            <input
              type="number" min="1" max={currentBalance} value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-zinc-500">Max: {currentBalance}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Reason</label>
            <input
              type="text" placeholder="e.g. Penalty, Expired bonus" value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
