"use client";

import { cn, formatPrice } from "@/lib/shared";
import { getPlanIndex, ALL_PLANS, getYearlyPrice, getLifetimePrice, colorConfig } from "@/lib/premium";
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

export function PlanCard({ plan, meta, highlights, price, onViewDetails, onCompare }: PlanCardProps) {
  const colors = colorConfig[meta.color] || colorConfig.gray;
  const Icon = meta.icon;
  const tierIndex = getPlanIndex(plan);
  const showFloatingBadge = colors.badgeGradient && meta.badge;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-zinc-900 p-6 transition-all duration-300",
        colors.border,
        colors.cardGradient ? `${colors.cardGradient} ${colors.hoverBorder}` : `${colors.hoverBorder} ${colors.hoverBg}`,
        colors.cardGradient && colors.glow
      )}
    >
      {showFloatingBadge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-3 py-0.5 text-xs font-bold text-white shadow-lg",
            colors.badgeGradient
          )}>
            <Sparkles size={12} />
            {meta.badge}
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

      <div className={cn("mb-1 flex items-center gap-1 text-xs", colors.tierText)}>
        <span>Tier {tierIndex + 1} of {ALL_PLANS.length}</span>
        <ArrowRight size={10} />
      </div>

      {price !== undefined && (
        <div className="mb-4 space-y-1">
          <div>
            <span className="text-2xl font-bold text-zinc-100">{formatPrice(price, "$")}</span>
            <span className="ml-1 text-sm text-zinc-500">/mo</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <span>{formatPrice(getYearlyPrice(plan), "$")}/yr</span>
            <span className="text-zinc-700">|</span>
            <span>{formatPrice(getLifetimePrice(plan), "$")} lifetime</span>
          </div>
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
            colors.btnBg,
            colors.btnText,
            colors.btnHoverBg
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
