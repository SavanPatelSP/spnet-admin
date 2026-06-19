"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { API_ROUTES } from "@/lib/constants";

interface RefundCoinsButtonProps {
  transactionId: string;
  type: string;
}

export default function RefundCoinsButton({ transactionId, type }: RefundCoinsButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (type === "REFUND") return null;

  async function handleRefund() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.COINS.REFUND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, description: "Refund requested by admin" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to process refund");
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError("Failed to process refund");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setConfirmOpen(true)} variant="ghost" size="sm" disabled={loading}>
        {loading ? "..." : "Refund"}
      </ActionButton>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setError(""); }}
        onConfirm={handleRefund}
        title="Refund Transaction"
        description="This will reverse the coin transaction and restore the balance. Are you sure?"
        confirmLabel="Process Refund"
        variant="primary"
        loading={loading}
        error={error}
      />
    </>
  );
}
