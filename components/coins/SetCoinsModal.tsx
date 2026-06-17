"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";

interface SetCoinsModalProps {
  licenseId: string;
  organization: string;
  currentBalance: number;
}

export default function SetCoinsModal({ licenseId, organization, currentBalance }: SetCoinsModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(currentBalance);
  const [type, setType] = useState("FINITE");
  const [reason, setReason] = useState("");

  async function handleSet() {
    if (balance < 0) {
      setError("Balance must be non-negative");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/coins/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, balance, type, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to set coin balance");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to set coin balance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="secondary" size="sm">Set Balance</ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Set Coin Balance"
        description={`Set exact coin balance for ${organization}`}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={handleSet} disabled={loading}>
              {loading ? "Setting..." : "Set Balance"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">New Balance</label>
            <input type="number" min="0" value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Coin Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500">
              {["FINITE", "PROMOTIONAL", "BONUS"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Reason (optional)</label>
            <input type="text" placeholder="Reason for setting balance..." value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
          </div>
        </div>
      </Modal>
    </>
  );
}
