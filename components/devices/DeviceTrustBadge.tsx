"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_ROUTES } from "@/lib/constants";
import { cn } from "@/lib/shared";
import { useToast } from "@/components/ui/Toast";
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";

interface Props {
  trustScore: number;
  size?: "sm" | "md" | "lg";
  activationId?: string;
  onUpdated?: () => void;
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-2 text-base",
};

export function DeviceTrustBadge({ trustScore, size = "md", activationId, onUpdated }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [score, setScore] = useState(trustScore);
  const [saving, setSaving] = useState(false);

  const tier = score <= 30 ? "low" : score <= 60 ? "medium" : "high";

  const tierConfig = {
    low: {
      label: "Low Trust",
      bg: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: ShieldAlert,
    },
    medium: {
      label: "Medium Trust",
      bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      icon: Shield,
    },
    high: {
      label: "High Trust",
      bg: "bg-green-500/10 text-green-400 border-green-500/20",
      icon: ShieldCheck,
    },
  };

  const config = tierConfig[tier];
  const Icon = config.icon;

  async function handleSave() {
    if (!activationId) return;
    setSaving(true);
    try {
      const res = await fetch(API_ROUTES.DEVICES.UPDATE_TRUST, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activationId, trustScore: score }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Failed to update trust score", "error");
        return;
      }
      setExpanded(false);
      router.refresh();
      onUpdated?.();
      toast(`Trust score updated to ${score}`, "success");
    } catch {
      toast("Failed to update trust score", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all hover:opacity-80",
          config.bg,
          sizeStyles[size],
        )}
      >
        <Icon size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        {score}
        {config.label}
      </button>

      {expanded && activationId && (
        <div className="absolute top-full z-10 mt-2 w-64 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
          <p className="mb-2 text-xs text-zinc-500">Adjust Trust Score</p>
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
            <span>0</span>
            <span className="font-medium text-zinc-200">{score}</span>
            <span>100</span>
          </div>
          <div className="mt-3 flex gap-2">
            <ActionButton size="sm" variant="secondary" onClick={() => setExpanded(false)}>
              Cancel
            </ActionButton>
            <ActionButton size="sm" onClick={handleSave} loading={saving}>
              Save
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
