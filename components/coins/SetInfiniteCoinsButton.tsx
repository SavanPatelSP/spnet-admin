"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";

interface SetInfiniteCoinsButtonProps {
  licenseId: string;
  organization: string;
}

export default function SetInfiniteCoinsButton({ licenseId }: SetInfiniteCoinsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSet() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/coins/set-infinite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to set infinite coins");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to set infinite coins");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <ActionButton onClick={handleSet} variant="primary" size="sm" disabled={loading}>
        {loading ? "Setting..." : "Set Infinite"}
      </ActionButton>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
