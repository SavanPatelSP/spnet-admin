"use client";

import { cn } from "@/lib/shared";
import { getPlanIndex, ALL_PLANS } from "@/lib/premium";
import type { PlanMeta } from "@/lib/premium";
import { Sparkles, ArrowRight, Check } from "lucide-react";

interface PlanCardProps {
  plan: string;
  meta: PlanMeta;
  highlights: string[];
  price?: number;
  onViewDetails: () => void;
  onCompare: () => void;
}

const colorConfig: Record<string, { text: string; border: string; bg: string; badge: string; glow: string }> = {
  zinc:   { text: "text-zinc-400",   border: "border-zinc-500/20",   bg: "bg-zinc-500/10",   badge: "bg-zinc-500/20 text-zinc-300",       glow: "" },
  green:  { text: "text-green-400",  border: "border-green-500/20",  bg: "bg-green-500/10",  badge: "bg-green-500/20 text-green-300",     glow: "" },
  blue:   { text: "text-blue-400",   border: "border-blue-500/20",   bg: "bg-blue-500/10",   badge: "bg-blue-500/20 text-blue-300",       glow: "" },
  purple: { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10", badge: "bg-purple-500/20 text-purple-300",   glow: "" },
  amber:  { text: "text-amber-400",  border: "border-amber-500/20",  bg: "bg-amber-500/10",  badge: "bg-amber-500/20 text-amber-300",     glow: "" },
  red:    { text: "text-red-400",    border: "border-red-500/20",    bg: "bg-red-500/10",    badge: "bg-red-500/20 text-red-300",         glow: "" },
  cyan:   { text: "text-cyan-400",   border: "border-cyan-500/20",   bg: "bg-cyan-500/10",   badge: "bg-cyan-500/20 text-cyan-300",       glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]" },
};

export function PlanCard({ plan, meta, highlights, price, onViewDetails, onCompare }: PlanCardProps) {
  const isTopTier = plan === "SP_PLAN";
  const colors = colorConfig[meta.color] || colorConfig.zinc;
  const Icon = meta.icon;
  const tierIndex = getPlanIndex(plan);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-zinc-900 p-6 transition-all duration-300",
        colors.border,
        isTopTier
          ? "border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 to-zinc-900 hover:border-cyan-400/60"
          : "hover:border-zinc-700 hover:bg-zinc-800/80",
        isTopTier && colors.glow
      )}
    >
      {isTopTier && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-0.5 text-xs font-bold text-white shadow-lg">
            <Sparkles size={12} />
            Top Tier
          </span>
        </div>
      )}

      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", colors.bg)}>
            <Icon size={18} className={colors.text} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">{meta.label}</h3>
            {meta.badge && (
              <span className={cn("mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", colors.badge)}>
                {meta.badge}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-zinc-500">{meta.description}</p>

      <div className={cn("mb-1 flex items-center gap-1 text-xs", isTopTier ? "text-cyan-600" : "text-zinc-600")}>
        <span>Tier {tierIndex + 1} of {ALL_PLANS.length}</span>
        <ArrowRight size={10} />
      </div>

      {price !== undefined && (
        <div className="mb-4">
          <span className="text-2xl font-bold text-zinc-100">${price}</span>
          <span className="ml-1 text-sm text-zinc-500">/mo</span>
        </div>
      )}

      <div className="mb-5 space-y-2">
        {highlights.slice(0, 4).map((h) => (
          <div key={h} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
            <span className="text-xs leading-relaxed text-zinc-400">{h}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-2">
        <button
          onClick={onViewDetails}
          className={cn(
            "flex-1 rounded-xl py-2 text-xs font-medium transition-colors",
            isTopTier
              ? "bg-cyan-600 text-white hover:bg-cyan-500"
              : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          )}
        >
          View Details
        </button>
        <button
          onClick={onCompare}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          Compare
        </button>
      </div>
    </div>
  );
}
