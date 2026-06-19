"use client";

import { useState } from "react";
import { cn } from "@/lib/shared";
import { ALL_PLANS, PLAN_META, PLAN_HIGHLIGHTS } from "@/lib/premium";
import { PLAN_PRICES } from "@/lib/constants";
import { PlanCard } from "./PlanCard";
import { PlanComparison } from "./PlanComparison";
import { PlanDetail } from "./PlanDetail";

type ViewMode = "grid" | "compare";

export function PlanOverview() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [comparePlans, setComparePlans] = useState<{ first: string; second: string }>({
    first: "FREE",
    second: "SP_PLAN",
  });

  const pricing = PLAN_PRICES;

  function handleViewDetails(plan: string) {
    setSelectedPlan(plan);
    setShowDetail(true);
  }

  function handleCompare(plan: string) {
    setViewMode("compare");
    setComparePlans((prev) => ({ ...prev, second: plan }));
  }

  return (
    <div className="space-y-6">
      <div className="flex w-fit items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        <button
          onClick={() => setViewMode("grid")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
            viewMode === "grid" ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Cards
        </button>
        <button
          onClick={() => setViewMode("compare")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
            viewMode === "compare" ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Compare Plans
        </button>
      </div>

      {viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ALL_PLANS.map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              meta={PLAN_META[plan]}
              highlights={PLAN_HIGHLIGHTS[plan]}
              price={pricing[plan]}
              onViewDetails={() => handleViewDetails(plan)}
              onCompare={() => handleCompare(plan)}
            />
          ))}
        </div>
      )}

      {viewMode === "compare" && (
        <PlanComparison
          firstPlan={comparePlans.first}
          secondPlan={comparePlans.second}
          pricing={pricing}
          onSelectFirst={(p) => setComparePlans((prev) => ({ ...prev, first: p }))}
          onSelectSecond={(p) => setComparePlans((prev) => ({ ...prev, second: p }))}
        />
      )}

      {selectedPlan && (
        <PlanDetail
          plan={selectedPlan}
          open={showDetail}
          onClose={() => setShowDetail(false)}
          price={pricing[selectedPlan]}
        />
      )}
    </div>
  );
}
