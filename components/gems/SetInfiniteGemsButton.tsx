"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";

interface SetInfiniteGemsButtonProps {
  licenseId: string;
  organization: string;
}

export default function SetInfiniteGemsButton({ licenseId }: SetInfiniteGemsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSet() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/gems/set-infinite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to set infinite gems");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to set infinite gems");
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
