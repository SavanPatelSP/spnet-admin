"use client";

import { Crown, Layers, Infinity } from "lucide-react";
import { PREMIUM_PLANS } from "@/lib/constants";

interface PremiumAnalyticsProps {
  planBreakdown: Record<string, number>;
  subscriptionTypeBreakdown: Record<string, number>;
  totalPremium: number;
  premiumLicenses: { plan: string }[];
}

export function PremiumAnalytics({
  planBreakdown,
  subscriptionTypeBreakdown,
  totalPremium,
}: PremiumAnalyticsProps) {
  const planOrder = PREMIUM_PLANS.filter((p) => planBreakdown[p]);
  const maxPlanCount = Math.max(...Object.values(planBreakdown), 1);

  const typeColors: Record<string, string> = {
    MONTHLY: "bg-blue-500",
    YEARLY: "bg-green-500",
    LIFETIME: "bg-purple-500",
    CUSTOM: "bg-cyan-500",
  };

  const typeTextColors: Record<string, string> = {
    MONTHLY: "text-blue-400",
    YEARLY: "text-green-400",
    LIFETIME: "text-purple-400",
    CUSTOM: "text-cyan-400",
  };

  const lifetimeCount = subscriptionTypeBreakdown.LIFETIME || 0;
  const nonLifetime = totalPremium - lifetimeCount;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Layers size={16} className="text-yellow-400" />
          <h3 className="font-semibold text-zinc-100">Plan Distribution</h3>
        </div>
        {planOrder.length === 0 ? (
          <p className="text-sm text-zinc-500">No premium plans active</p>
        ) : (
          <div className="space-y-3">
            {planOrder.map((plan) => {
              const count = planBreakdown[plan] || 0;
              const pct = Math.round((count / totalPremium) * 100);
              return (
                <div key={plan}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Crown size={13} className="text-yellow-400" />
                      <span className="text-zinc-300">{plan}</span>
                    </div>
                    <span className="text-zinc-500">
                      {count} <span className="text-xs text-zinc-600">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-yellow-500 transition-all"
                      style={{ width: `${(count / maxPlanCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Layers size={16} className="text-blue-400" />
          <h3 className="font-semibold text-zinc-100">Subscription Type Distribution</h3>
        </div>
        {Object.keys(subscriptionTypeBreakdown).length === 0 ? (
          <p className="text-sm text-zinc-500">No subscription data</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(subscriptionTypeBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const pct = Math.round((count / totalPremium) * 100);
                return (
                  <div key={type}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={typeTextColors[type] || "text-zinc-300"}>{type}</span>
                      <span className="text-zinc-500">
                        {count} <span className="text-xs text-zinc-600">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${typeColors[type] || "bg-zinc-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Infinity size={16} className="text-purple-400" />
          <h3 className="font-semibold text-zinc-100">Lifetime Breakdown</h3>
        </div>
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400">{lifetimeCount}</p>
            <p className="mt-1 text-xs text-zinc-500">Lifetime</p>
          </div>
          <div className="h-12 w-px bg-zinc-800" />
          <div className="text-center">
            <p className="text-3xl font-bold text-zinc-100">{nonLifetime}</p>
            <p className="mt-1 text-xs text-zinc-500">Term-based</p>
          </div>
        </div>
        {totalPremium > 0 && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${(lifetimeCount / totalPremium) * 100}%` }}
            />
          </div>
        )}
        <p className="mt-3 text-center text-xs text-zinc-600">
          {lifetimeCount} of {totalPremium} premium licenses are lifetime (
          {totalPremium > 0 ? Math.round((lifetimeCount / totalPremium) * 100) : 0}%)
        </p>
      </div>
    </div>
  );
}
