"use client";

import { useState } from "react";
import { Crown, Coins, Gem, KeyRound, ArrowLeft, Sparkles } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import { PlanOverview } from "@/components/premium/PlanOverview";
import { CoinPackageOverview } from "./CoinPackageOverview";
import { GemPackageOverview } from "./GemPackageOverview";
import { LicensePackageOverview } from "./LicensePackageOverview";

type Category = "landing" | "premium" | "coins" | "gems" | "licenses";

const categories = [
  {
    id: "premium" as Category,
    icon: Crown,
    title: "Premium Plans",
    description: "Explore subscription tiers from Free to SP's exclusive plan.",
    planCount: 8,
    summary: "Free · Basic · Student · Plus · Pro · Business · Enterprise · SP's Plan",
    color: "purple",
  },
  {
    id: "coins" as Category,
    icon: Coins,
    title: "Coin Packages",
    description: "Virtual currency packages for platform economy operations.",
    planCount: 4,
    summary: "Starter · Growth · Pro · Enterprise — from ₹99 to ₹2,999",
    color: "yellow",
  },
  {
    id: "gems" as Category,
    icon: Gem,
    title: "Gem Packages",
    description: "Premium gem packages with purchasing power for Premium and Licenses.",
    planCount: 4,
    summary: "Starter · Growth · Pro · Enterprise — 10 to 500 gems",
    color: "blue",
  },
  {
    id: "licenses" as Category,
    icon: KeyRound,
    title: "License Packages",
    description: "License templates with tiered features, device limits, and durations.",
    planCount: 0,
    summary: "Configured via templates — plan, devices, duration, features",
    color: "green",
  },
];

export function PlanOverviewHub() {
  const [category, setCategory] = useState<Category>("landing");

  if (category === "premium") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setCategory("landing")}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft size={14} />
          Back to Plan Overview
        </button>
        <PlanOverview />
      </div>
    );
  }

  if (category === "coins") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setCategory("landing")}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft size={14} />
          Back to Plan Overview
        </button>
        <CoinPackageOverview />
      </div>
    );
  }

  if (category === "gems") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setCategory("landing")}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft size={14} />
          Back to Plan Overview
        </button>
        <GemPackageOverview />
      </div>
    );
  }

  if (category === "licenses") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setCategory("landing")}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeft size={14} />
          Back to Plan Overview
        </button>
        <LicensePackageOverview />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
          <Sparkles size={20} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Unified Plan Center</h2>
          <p className="text-sm text-zinc-500">Browse all plan types and packages available on the platform.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            icon={cat.icon}
            title={cat.title}
            description={cat.description}
            planCount={cat.planCount}
            summary={cat.summary}
            color={cat.color}
            onClick={() => setCategory(cat.id)}
          />
        ))}
      </div>
    </div>
  );
}
