"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/shared";
import { Modal } from "@/components/ui/Modal";
import {
  PLAN_META,
  PLAN_FEATURES_BY_CATEGORY,
  getPlanCategories,
  getPlanIndex,
  ALL_PLANS,
  getNextPlan,
  getPrevPlan,
  getPlanComparison,
} from "@/lib/premium";
import { UpgradePath } from "./UpgradePath";
import { ChevronDown, ChevronRight, Check, X, ArrowRight } from "lucide-react";

interface PlanDetailProps {
  plan: string;
  open: boolean;
  onClose: () => void;
  price?: number;
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

export function PlanDetail({ plan, open, onClose, price }: PlanDetailProps) {
  const meta = PLAN_META[plan];
  const colors = colorConfig[meta.color] || colorConfig.zinc;
  const Icon = meta.icon;
  const categories = getPlanCategories(plan);
  const features = PLAN_FEATURES_BY_CATEGORY[plan] || {};
  const nextPlan = getNextPlan(plan);
  const prevPlan = getPrevPlan(plan);
  const isTopTier = plan === "SP_PLAN";

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(categories.length > 0 ? [categories[0]] : [])
  );

  function toggleCategory(cat: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const nextComparison = useMemo(
    () => (nextPlan ? getPlanComparison(plan, nextPlan) : null),
    [plan, nextPlan]
  );

  const prevComparison = useMemo(
    () => (prevPlan ? getPlanComparison(prevPlan, plan) : null),
    [plan, prevPlan]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meta.label}
      description={meta.description}
      size="xl"
    >
      <div className="space-y-8">
        <div className={cn("flex flex-wrap items-start gap-4 rounded-2xl border p-5", colors.border, colors.bg)}>
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl", colors.bg)}>
            <Icon size={28} className={colors.text} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-100">{meta.label}</h2>
              {meta.badge && (
                <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", colors.badge)}>
                  {meta.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-500">{meta.description}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-zinc-600">
                Tier {getPlanIndex(plan) + 1} of {ALL_PLANS.length}
              </span>
              {price !== undefined && (
                <span className="text-sm font-semibold text-zinc-200">
                  ${price}<span className="text-xs font-normal text-zinc-500">/mo</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-zinc-300">Features by Category</h3>
          <div className="space-y-2">
            {categories.map((cat) => {
              const catFeatures = features[cat] || [];
              const isExpanded = expanded.has(cat);
              return (
                <div key={cat} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-800/50"
                  >
                    <span className="text-sm font-medium text-zinc-200">{cat}</span>
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-zinc-500" />
                    ) : (
                      <ChevronRight size={14} className="text-zinc-500" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-zinc-800 px-4 py-3">
                      <ul className="space-y-1.5">
                        {catFeatures.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                            <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-300">Plan Comparison</h3>

          {prevPlan && prevComparison && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                vs {PLAN_META[prevPlan].label}
                <span className="text-xs font-normal text-zinc-500">(previous tier)</span>
              </div>
              {prevComparison.added.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 text-xs font-medium text-green-400">Added in {meta.label}:</p>
                  <ul className="space-y-1">
                    {prevComparison.added.slice(0, 5).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-400">
                        <Check size={12} className="mt-0.5 shrink-0 text-green-500" />
                        {f}
                      </li>
                    ))}
                    {prevComparison.added.length > 5 && (
                      <li className="text-xs text-zinc-500">+{prevComparison.added.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {nextPlan && nextComparison && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                vs {PLAN_META[nextPlan].label}
                <span className="text-xs font-normal text-zinc-500">(next tier)</span>
              </div>
              {nextComparison.added.length > 0 ? (
                <div className="mt-2">
                  <p className="mb-1 text-xs font-medium text-amber-400">What you&apos;d gain:</p>
                  <ul className="space-y-1">
                    {nextComparison.added.slice(0, 5).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-400">
                        <ArrowRight size={12} className="mt-0.5 shrink-0 text-amber-500" />
                        {f}
                      </li>
                    ))}
                    {nextComparison.added.length > 5 && (
                      <li className="text-xs text-zinc-500">+{nextComparison.added.length - 5} more</li>
                    )}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">Same feature set as current plan</p>
              )}
            </div>
          )}
        </div>

        <UpgradePath fromPlan={plan} />

        {nextPlan && (
          <div className="flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200">
              Compare with {PLAN_META[nextPlan].label}
              <ArrowRight size={14} />
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
