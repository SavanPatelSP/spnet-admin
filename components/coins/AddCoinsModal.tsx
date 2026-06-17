"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";

interface AddCoinsModalProps {
  licenseId: string;
  organization: string;
}

export default function AddCoinsModal({ licenseId, organization }: AddCoinsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  async function handleAdd() {
    setError("");
    if (amount < 1) {
      setError("Amount must be at least 1");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.COINS.ADD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, amount, reason: reason || null, description: description || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add coins");
        return;
      }
      setOpen(false);
      setAmount(100);
      setReason("");
      setDescription("");
      router.refresh();
    } catch {
      setError("Failed to add coins");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="primary" size="sm">
        Add Coins
      </ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Coins"
        description={`Add coins to ${organization}.`}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleAdd} disabled={loading}>
              {loading ? "Adding..." : "Add Coins"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Amount</label>
            <input
              type="number" min="1" value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Reason</label>
            <input
              type="text" placeholder="e.g. Purchase credit, Bonus reward" value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Description (optional)</label>
            <textarea
              placeholder="Additional details..." value={description}
              onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
