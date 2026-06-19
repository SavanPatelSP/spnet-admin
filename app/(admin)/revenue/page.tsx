import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Revenue" };

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { PREMIUM_PLANS, PLAN_PRICES } from "@/lib/constants";
import { CreditCard, TrendingUp, Crown, TrendingDown, Activity, Minus, AlertTriangle } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/shared";

export default async function RevenuePage() {
  const [licenses, premiumSubs, allPremiumSubs] = await Promise.all([
    prisma.license.findMany(),
    prisma.premiumSubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.premiumSubscription.findMany(),
  ]);

  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const premiumLicenses = licenses.filter((l) => PREMIUM_PLANS.includes(l.plan as typeof PREMIUM_PLANS[number])).length;
  const premiumRate = licenses.length > 0 ? Math.round((premiumLicenses / licenses.length) * 100) : 0;

  const planDist = licenses.reduce(
    (acc, l) => {
      acc[l.plan] = (acc[l.plan] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalSubs = allPremiumSubs.length;
  const revokedSubs = allPremiumSubs.filter((s) => s.action === "REVOKED");
  const uniqueRevokedLicenseIds = new Set(revokedSubs.map((s) => s.licenseId));
  const revokedCount = uniqueRevokedLicenseIds.size;
  const revokeEvents = revokedSubs.length;
  const extensions = allPremiumSubs.filter((s) => s.action === "EXTENDED").length;
  const churnRate = totalSubs > 0 ? Math.round((revokeEvents / totalSubs) * 100) : 0;

  const lifetimeSubs = allPremiumSubs.filter((s) => s.subscriptionType === "LIFETIME").length;
  const monthlySubsCount = allPremiumSubs.filter((s) => s.subscriptionType === "MONTHLY").length;
  const yearlySubsCount = allPremiumSubs.filter((s) => s.subscriptionType === "YEARLY").length;
  const customSubsCount = allPremiumSubs.filter((s) => s.subscriptionType === "CUSTOM").length;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthSubs = allPremiumSubs.filter((s) => s.createdAt >= currentMonthStart).length;
  const prevMonthSubs = allPremiumSubs.filter(
    (s) => s.createdAt >= prevMonthStart && s.createdAt < currentMonthStart,
  ).length;
  const subTrend = prevMonthSubs > 0 ? Math.round(((thisMonthSubs - prevMonthSubs) / prevMonthSubs) * 100) : 0;

  const thisMonthRevokes = allPremiumSubs.filter(
    (s) => s.action === "REVOKED" && s.createdAt >= currentMonthStart,
  ).length;
  const prevMonthRevokes = allPremiumSubs.filter(
    (s) => s.action === "REVOKED" && s.createdAt >= prevMonthStart && s.createdAt < currentMonthStart,
  ).length;
  const revokeTrend = prevMonthRevokes > 0 ? Math.round(((thisMonthRevokes - prevMonthRevokes) / prevMonthRevokes) * 100) : 0;

  const revokedRevenue = revokedSubs.reduce((sum, s) => {
    const basePrice = PLAN_PRICES[s.plan as keyof typeof PLAN_PRICES];
    const multiplier = s.subscriptionType === "YEARLY" ? 12 : s.subscriptionType === "LIFETIME" ? 120 : s.subscriptionType === "CUSTOM" ? s.durationDays ? s.durationDays / 30 : 1 : 1;
    const annualized = (basePrice || 0) * multiplier;
    return sum + annualized;
  }, 0);

  const monthlySubs: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const count = allPremiumSubs.filter(
      (s) => s.createdAt >= d && s.createdAt < new Date(d.getFullYear(), d.getMonth() + 1, 1),
    ).length;
    monthlySubs.push({ month: monthLabel, count });
  }

  const maxMonthly = Math.max(...monthlySubs.map((m) => m.count), 1);

  const conversionRate = activeLicenses > 0
    ? Math.round((premiumLicenses / activeLicenses) * 100)
    : 0;

  const subRows = premiumSubs.map((s) => ({
    id: s.id,
    values: { plan: s.plan, action: s.action, date: formatDate(s.createdAt), licenseId: s.licenseId },
    cells: [
      <span key="plan" className="font-medium">{s.plan}</span>,
      <span key="action" className="text-sm text-zinc-400">{s.action}</span>,
      <span key="date" className="text-sm text-zinc-500">{formatDate(s.createdAt)}</span>,
      <span key="id" className="text-xs text-zinc-600">{s.licenseId.slice(0, 8)}...</span>,
    ],
  }));

  return (
    <div className="space-y-8">
      <PageHeader title="Revenue Dashboard" description="Track earnings, subscriptions and financial metrics." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Licenses" value={licenses.length} icon={CreditCard} color="blue" subtitle={`${activeLicenses} active`} />
        <StatCard title="Premium Licenses" value={premiumLicenses} icon={Crown} color="yellow" subtitle={`${premiumRate}% premium rate`} />
        <StatCard title="Conversion" value={`${conversionRate}%`} icon={TrendingUp} color="green" subtitle="Free → Premium" />
        <StatCard title="Extensions" value={extensions} icon={Activity} color="purple" subtitle="Premium extensions" />
      </StatCardGrid>

      <StatCardGrid columns={4}>
        <StatCard
          title="Total Subscriptions"
          value={totalSubs}
          icon={CreditCard}
          color="blue"
          subtitle={
            subTrend !== 0
              ? `${subTrend > 0 ? "+" : ""}${subTrend}% vs last month`
              : "No change vs last month"
          }
          trend={{ value: `${subTrend > 0 ? "+" : ""}${subTrend}%`, direction: subTrend > 0 ? "up" : subTrend < 0 ? "down" : "neutral" }}
        />
        <StatCard
          title="Revoked Subscriptions"
          value={revokedCount}
          icon={AlertTriangle}
          color="red"
          subtitle={
            revokeTrend !== 0
              ? `${revokeTrend > 0 ? "+" : ""}${revokeTrend}% vs last month`
              : "No change vs last month"
          }
          trend={{ value: `${revokeTrend > 0 ? "+" : ""}${revokeTrend}%`, direction: revokeTrend > 0 ? "up" : revokeTrend < 0 ? "down" : "neutral" }}
        />
        <StatCard
          title="Churn Rate"
          value={`${churnRate}%`}
          icon={TrendingDown}
          color={churnRate > 10 ? "red" : churnRate > 5 ? "yellow" : "green"}
          subtitle={`${revokeEvents} revoke events`}
        />
        <StatCard
          title="Subscription Breakdown"
          value={`${monthlySubsCount + yearlySubsCount + lifetimeSubs + customSubsCount}`}
          icon={Minus}
          color="purple"
          subtitle={`${monthlySubsCount}M / ${yearlySubsCount}Y / ${lifetimeSubs}L / ${customSubsCount}C`}
        />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Revenue Impact Summary</h2>
          <span className="text-sm text-zinc-500">{revokedCount} revoked license{revokedCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-xs text-red-400 mb-1">Lost Revenue (Revoked)</p>
            <p className="text-2xl font-bold text-red-300">{formatPrice(revokedRevenue, "$")}</p>
            <p className="text-[10px] text-red-400/60">Annualized value of revoked subscriptions</p>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs text-green-400 mb-1">Active Licenses</p>
            <p className="text-2xl font-bold text-green-300">{activeLicenses}</p>
            <p className="text-[10px] text-green-400/60">Out of {licenses.length} total</p>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-xs text-yellow-400 mb-1">Churn Impact</p>
            <p className="text-2xl font-bold text-yellow-300">{churnRate}%</p>
            <p className="text-[10px] text-yellow-400/60">{revokeEvents} revocations across {revokedCount} license{revokedCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Monthly Subscription Activity</h2>
          <div className="space-y-3">
            {monthlySubs.map((m) => (
              <div key={m.month} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <span className="text-sm font-medium w-24">{m.month}</span>
                <div className="flex-1 mx-4">
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-700">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(m.count / maxMonthly) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm text-zinc-400">{m.count} subs</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Plan Distribution</h2>
          <div className="space-y-3">
            {Object.entries(planDist)
              .sort(([, a], [, b]) => b - a)
              .map(([plan, count]) => {
                const max = Math.max(...Object.values(planDist));
                const isPremium = PREMIUM_PLANS.includes(plan as typeof PREMIUM_PLANS[number]);
                return (
                  <div key={plan} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isPremium && <Crown size={14} className="text-yellow-400" />}
                      <span className="text-sm">{plan}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 mx-4">
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-zinc-700">
                        <div className={`h-full rounded-full ${isPremium ? "bg-yellow-500" : "bg-zinc-500"}`}
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-zinc-400">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Premium Activity</h2>
          <span className="text-sm text-zinc-500">{totalSubs} total events</span>
        </div>
        <DataTable
          columns={[
            { key: "plan", label: "Plan", sortable: true },
            { key: "action", label: "Action", sortable: true },
            { key: "date", label: "Date", sortable: true },
            { key: "licenseId", label: "License ID" },
          ]}
          rows={subRows}
          pageSize={8}
          searchPlaceholder="Search premium activity..."
        />
      </div>
    </div>
  );
}
