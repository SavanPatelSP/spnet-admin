"use client";

import { cn } from "@/lib/shared";
import { PLAN_META, getNextPlan, getPlanUpgradePath, getPlanIndex, ALL_PLANS } from "@/lib/premium";
import { ArrowRight, ArrowDown, Check, Crown, Sparkles } from "lucide-react";

interface UpgradePathProps {
  fromPlan: string;
}

const colorConfig: Record<string, { text: string; border: string; bg: string }> = {
  zinc:   { text: "text-zinc-400", border: "border-zinc-500/20", bg: "bg-zinc-500/10" },
  green:  { text: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/10" },
  blue:   { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10" },
  purple: { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10" },
  amber:  { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10" },
  red:    { text: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10" },
  cyan:   { text: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/10" },
};

export function UpgradePath({ fromPlan }: UpgradePathProps) {
  const path = getPlanUpgradePath(fromPlan);
  const meta = PLAN_META[fromPlan];
  const colors = colorConfig[meta.color] || colorConfig.zinc;
  const Icon = meta.icon;
  const isTopTier = fromPlan === "SP_PLAN";

  if (isTopTier || !path) {
    return (
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-zinc-900 p-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Crown size={24} className="text-amber-400" />
          <Sparkles size={20} className="text-cyan-400" />
        </div>
        <p className="text-lg font-bold text-zinc-100">You&apos;re on the top tier!</p>
        <p className="mt-1 text-sm text-zinc-500">
          SP&apos;s Plan includes every feature across all tiers with exclusive priority access.
        </p>
      </div>
    );
  }

  const nextMeta = PLAN_META[path.next!];
  const nextColors = colorConfig[nextMeta.color] || colorConfig.zinc;
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
