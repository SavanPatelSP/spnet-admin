"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";

interface RemoveInfiniteCoinsButtonProps {
  licenseId: string;
  organization: string;
}

export default function RemoveInfiniteCoinsButton({ licenseId }: RemoveInfiniteCoinsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRemove() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/coins/remove-infinite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to remove infinite coins");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to remove infinite coins");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ActionButton onClick={handleRemove} variant="secondary" size="sm" disabled={loading}>
        {loading ? "Removing..." : "Remove Infinite"}
      </ActionButton>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
