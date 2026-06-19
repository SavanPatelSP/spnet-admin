"use client";

import { useMemo } from "react";
import { cn } from "@/lib/shared";
import {
  ALL_PLANS,
  PLAN_META,
  PLAN_FEATURES_BY_CATEGORY,
  getPlanCategories,
  getPlanIndex,
} from "@/lib/premium";
import { Check, X, ArrowRight, Search } from "lucide-react";

interface PlanComparisonProps {
  firstPlan: string;
  secondPlan: string;
  pricing: Record<string, number>;
  onSelectFirst: (plan: string) => void;
  onSelectSecond: (plan: string) => void;
}

const colorConfig: Record<string, { text: string; border: string; bg: string; badge: string }> = {
  zinc:   { text: "text-zinc-400", border: "border-zinc-500/20", bg: "bg-zinc-500/10", badge: "bg-zinc-500/20 text-zinc-300" },
  green:  { text: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/10", badge: "bg-green-500/20 text-green-300" },
  blue:   { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", badge: "bg-blue-500/20 text-blue-300" },
  purple: { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10", badge: "bg-purple-500/20 text-purple-300" },
  amber:  { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", badge: "bg-amber-500/20 text-amber-300" },
  red:    { text: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10", badge: "bg-red-500/20 text-red-300" },
  cyan:   { text: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/10", badge: "bg-cyan-500/20 text-cyan-300" },
};

function PlanSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const meta = PLAN_META[value];
  const Icon = meta.icon;
  const colors = colorConfig[meta.color] || colorConfig.zinc;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-xl border bg-zinc-900 px-4 py-2.5 pr-10 text-sm font-medium text-zinc-100 transition-colors",
            colors.border,
            "focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          )}
        >
          {ALL_PLANS.map((p) => (
            <option key={p} value={p}>
              {PLAN_META[p].label} — {PLAN_META[p].badge || `Tier ${getPlanIndex(p) + 1}`}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <Search size={14} className="text-zinc-500" />
        </div>
      </div>
    </div>
  );
}

function PlanHeader({ plan, price }: { plan: string; price?: number }) {
  const meta = PLAN_META[plan];
  const colors = colorConfig[meta.color] || colorConfig.zinc;
  const Icon = meta.icon;
  const isTopTier = plan === "SP_PLAN";

  return (
    <div className={cn(
      "flex flex-col items-center gap-3 rounded-2xl border bg-zinc-900 p-5 text-center",
      isTopTier ? "border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-zinc-900" : colors.border
    )}>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", colors.bg)}>
        <Icon size={24} className={colors.text} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-zinc-100">{meta.label}</h3>
        {meta.badge && (
          <span className={cn("mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", colors.badge)}>
            {meta.badge}
          </span>
        )}
      </div>
      {price !== undefined && (
        <div>
          <span className="text-2xl font-bold text-zinc-100">${price}</span>
          <span className="ml-1 text-sm text-zinc-500">/mo</span>
        </div>
      )}
    </div>
  );
}

export function PlanComparison({ firstPlan, secondPlan, pricing, onSelectFirst, onSelectSecond }: PlanComparisonProps) {
  const features1 = PLAN_FEATURES_BY_CATEGORY[firstPlan] || {};
  const features2 = PLAN_FEATURES_BY_CATEGORY[secondPlan] || {};
  const cats1 = getPlanCategories(firstPlan);
  const cats2 = getPlanCategories(secondPlan);
  const allCategories = [...new Set([...cats1, ...cats2])];

  const categoryData = useMemo(() => {
    return allCategories.map((cat) => {
      const f1 = features1[cat] || [];
      const f2 = features2[cat] || [];
      const f1Set = new Set(f1);
      const f2Set = new Set(f2);
      return {
        category: cat,
        common: f1.filter((f) => f2Set.has(f)),
        added: f2.filter((f) => !f1Set.has(f)),
        removed: f1.filter((f) => !f2Set.has(f)),
      };
    });
  }, [firstPlan, secondPlan]);

  const meta1 = PLAN_META[firstPlan];
  const meta2 = PLAN_META[secondPlan];
  const colors1 = colorConfig[meta1.color] || colorConfig.zinc;
  const colors2 = colorConfig[meta2.color] || colorConfig.zinc;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <PlanSelect value={firstPlan} onChange={onSelectFirst} label="Plan A" />
        <PlanSelect value={secondPlan} onChange={onSelectSecond} label="Plan B" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlanHeader plan={firstPlan} price={pricing[firstPlan]} />
        <PlanHeader plan={secondPlan} price={pricing[secondPlan]} />
      </div>

      <div className="space-y-4">
        {categoryData.map(({ category, common, added, removed }) => {
          if (common.length === 0 && added.length === 0 && removed.length === 0) return null;
          return (
            <div key={category} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">{category}</h4>
              <div className="space-y-2">
                {common.map((f) => (
                  <div key={f} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs">
                    <span className="text-zinc-400">{f}</span>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Check size={12} className="text-zinc-500" />
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Check size={12} className="text-zinc-500" />
                    </div>
                  </div>
                ))}
                {added.map((f) => (
                  <div key={f} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-green-950/20 px-2 py-1 text-xs">
                    <span className="text-green-300">{f}</span>
                    <div className="flex items-center gap-1 text-zinc-600">
                      <X size={12} />
                    </div>
                    <div className="flex items-center gap-1 text-green-500">
                      <Check size={12} />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-green-500">Added</span>
                    </div>
                  </div>
                ))}
                {removed.map((f) => (
                  <div key={f} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-red-950/20 px-2 py-1 text-xs">
                    <span className="text-red-300 line-through">{f}</span>
                    <div className="flex items-center gap-1 text-red-500">
                      <Check size={12} />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-red-500">Has</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-600">
                      <X size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
