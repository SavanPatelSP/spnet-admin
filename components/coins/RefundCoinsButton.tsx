"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";

interface RefundCoinsButtonProps {
  transactionId: string;
  type: string;
}

export default function RefundCoinsButton({ transactionId, type }: RefundCoinsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (type === "REFUND") return null;

  async function handleRefund() {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.COINS.REFUND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, description: "Refund requested by admin" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to process refund");
        return;
      }
      router.refresh();
    } catch {
      alert("Failed to process refund");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ActionButton onClick={handleRefund} variant="ghost" size="sm" disabled={loading} confirmText="Confirm refund?">
      {loading ? "..." : "Refund"}
    </ActionButton>
  );
}
