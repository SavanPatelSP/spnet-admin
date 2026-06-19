"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/shared";
import { ALL_PLANS, PLAN_META, PLAN_HIGHLIGHTS } from "@/lib/premium";
import { PlanCard } from "./PlanCard";
import { PlanComparison } from "./PlanComparison";
import { PlanDetail } from "./PlanDetail";

type ViewMode = "grid" | "compare";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-3 h-5 w-24 rounded bg-zinc-800" />
      <div className="mb-2 h-4 w-32 rounded bg-zinc-800" />
      <div className="mb-4 h-3 w-48 rounded bg-zinc-800" />
      <div className="mb-4 h-8 w-20 rounded bg-zinc-800" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-3 w-full rounded bg-zinc-800" />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-9 flex-1 rounded-xl bg-zinc-800" />
        <div className="h-9 w-20 rounded-xl bg-zinc-800" />
      </div>
    </div>
  );
}

export function PlanOverview() {
  const [pricing, setPricing] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [comparePlans, setComparePlans] = useState<{ first: string; second: string }>({
    first: "FREE",
    second: "SP_PLAN",
  });

  async function fetchPricing() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/roles/pricing");
      if (!res.ok) throw new Error("Failed to load pricing");
      const data = await res.json();
      setPricing(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPricing();
  }, []);

  function handleViewDetails(plan: string) {
    setSelectedPlan(plan);
    setShowDetail(true);
  }

  function handleCompare(plan: string) {
    setViewMode("compare");
    setComparePlans((prev) => ({ ...prev, second: plan }));
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12">
        <p className="mb-4 text-zinc-400">{error}</p>
        <button
          onClick={fetchPricing}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1 w-fit">
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

      {loading && viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ALL_PLANS.map((plan) => (
            <SkeletonCard key={plan} />
          ))}
        </div>
      )}

      {!loading && viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ALL_PLANS.map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              meta={PLAN_META[plan]}
              highlights={PLAN_HIGHLIGHTS[plan]}
              price={pricing?.[plan] ?? undefined}
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
          pricing={pricing ?? {}}
          onSelectFirst={(p) => setComparePlans((prev) => ({ ...prev, first: p }))}
          onSelectSecond={(p) => setComparePlans((prev) => ({ ...prev, second: p }))}
        />
      )}

      {selectedPlan && (
        <PlanDetail
          plan={selectedPlan}
          open={showDetail}
          onClose={() => setShowDetail(false)}
          price={pricing?.[selectedPlan] ?? undefined}
        />
      )}
    </div>
  );
}
