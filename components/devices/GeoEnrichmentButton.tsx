"use client";

import { useState } from "react";
import { usePermission } from "@/hooks/usePermissions";
import { Globe, Loader2 } from "lucide-react";

interface GeoEnrichmentButtonProps {
  onComplete?: (enriched: number) => void;
  disabled?: boolean;
}

export function GeoEnrichmentButton({ onComplete, disabled }: GeoEnrichmentButtonProps) {
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(false);

  if (!hasPermission("Manage Device Policies")) return null;

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/devices/batch-enrich", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        onComplete?.(json.data.enriched);
        alert(`Enriched ${json.data.enriched} countries`);
      } else {
        alert(json.error || "Failed to enrich countries");
      }
    } catch {
      alert("Failed to enrich countries");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
      aria-label="Resolve Countries"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
      Resolve Countries
    </button>
  );
}
