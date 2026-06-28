"use client";

import { cn } from "@/lib/shared";
import { PLAN_META, getNextPlan, getPlanUpgradePath, getPlanIndex, ALL_PLANS, colorConfig } from "@/lib/premium";
import { ArrowRight, ArrowDown, Check, Crown, Sparkles } from "lucide-react";

interface UpgradePathProps {
  fromPlan: string;
}

export function UpgradePath({ fromPlan }: UpgradePathProps) {
  const path = getPlanUpgradePath(fromPlan);
  const meta = PLAN_META[fromPlan];
  const colors = colorConfig[meta.color] || colorConfig.gray;
  const Icon = meta.icon;
  const showTopTier = !path || colors.badgeGradient;

  if (showTopTier) {
    return (
      <div className={cn(
        "rounded-2xl border bg-gradient-to-b to-zinc-900 p-6 text-center",
        colors.compareBorder,
        colors.compareBg
      )}>
        <div className="mb-3 flex items-center justify-center gap-2">
          <Crown size={24} className="text-amber-400" />
          <Sparkles size={20} className={colors.text} />
        </div>
        <p className="text-lg font-bold text-zinc-100">You&apos;re on the top tier!</p>
        <p className="mt-1 text-sm text-zinc-500">
          {meta.badge === "Founder Edition"
            ? "SP's Plan includes every feature across all tiers with exclusive priority access."
            : meta.badge === "Elite"
            ? "Extreme plan offers maximum capabilities with elite-level resources and support."
            : `${meta.label} includes every feature across all tiers with exclusive priority access.`}
        </p>
      </div>
    );
  }

  const nextMeta = PLAN_META[path.next!];
  const nextColors = colorConfig[nextMeta.color] || colorConfig.gray;
  const NextIcon = nextMeta.icon;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-zinc-300">Upgrade Path</h4>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-2">
        <div className={cn("flex w-full items-center gap-3 rounded-xl border p-4 sm:w-auto sm:min-w-[180px]", colors.border, colors.bg)}>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colors.bg)}>
            <Icon size={20} className={colors.text} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">{meta.label}</p>
            <p className="text-xs text-zinc-500">Tier {getPlanIndex(fromPlan) + 1}</p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <ArrowRight size={20} className="hidden text-zinc-600 sm:block" />
          <ArrowDown size={20} className="text-zinc-600 sm:hidden" />
        </div>

        <div className={cn("flex w-full items-center gap-3 rounded-xl border p-4 sm:w-auto sm:min-w-[180px]", nextColors.border, nextColors.bg)}>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", nextColors.bg)}>
            <NextIcon size={20} className={nextColors.text} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">{nextMeta.label}</p>
            <p className="text-xs text-zinc-500">Tier {getPlanIndex(path.next!) + 1}</p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <ArrowRight size={20} className="hidden text-zinc-600 sm:block" />
          <ArrowDown size={20} className="text-zinc-600 sm:hidden" />
        </div>

        <div className="w-full rounded-xl border border-green-500/20 bg-green-950/10 p-4 sm:w-auto sm:min-w-[200px] sm:flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-400">Benefits Gained</p>
          {path.gained.length > 0 ? (
            <ul className="space-y-1">
              {path.gained.slice(0, 4).map((g) => (
                <li key={g} className="flex items-start gap-1.5 text-xs text-zinc-300">
                  <Check size={12} className="mt-0.5 shrink-0 text-green-500" />
                  {g}
                </li>
              ))}
              {path.gained.length > 4 && (
                <li className="text-xs text-zinc-500">+{path.gained.length - 4} more</li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">Same feature set</p>
          )}
        </div>
      </div>
    </div>
  );
}
