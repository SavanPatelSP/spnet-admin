export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { CreditCard, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

const MOCK_MONTHLY_REVENUE = [
  { month: "Jan", revenue: 12400 },
  { month: "Feb", revenue: 18900 },
  { month: "Mar", revenue: 16200 },
  { month: "Apr", revenue: 22100 },
  { month: "May", revenue: 19800 },
  { month: "Jun", revenue: 28100 },
];

const MOCK_REVENUE_BREAKDOWN = [
  { source: "Premium Subscriptions", amount: 28400 },
  { source: "In-App Purchases", amount: 10800 },
  { source: "Advertising", amount: 2900 },
];

export default async function RevenuePage() {
  const licenses = await prisma.license.findMany();
  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const totalRevenue = MOCK_MONTHLY_REVENUE.reduce((t, m) => t + m.revenue, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Revenue Dashboard" description="Track earnings, subscriptions and financial metrics." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}K`} icon={DollarSign} color="green" subtitle="Last 6 months" />
        <StatCard title="Monthly Avg" value={`$${(totalRevenue / 6 / 1000).toFixed(1)}K`} icon={TrendingUp} color="blue" subtitle="6-month average" />
        <StatCard title="Active Licenses" value={activeLicenses} icon={BarChart3} color="purple" subtitle={`${licenses.length} total`} />
        <StatCard title="Revenue/License" value={`$${(totalRevenue / (licenses.length || 1)).toFixed(0)}`} icon={CreditCard} color="yellow" subtitle="Per license" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Monthly Revenue Trend</h2>
          <div className="space-y-3">
            {MOCK_MONTHLY_REVENUE.map((m) => {
              const max = Math.max(...MOCK_MONTHLY_REVENUE.map((r) => r.revenue));
              return (
                <div key={m.month} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                  <span className="text-sm font-medium w-10">{m.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-700">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${(m.revenue / max) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm text-zinc-400">${(m.revenue / 1000).toFixed(1)}K</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Revenue Breakdown</h2>
          <div className="space-y-3">
            {MOCK_REVENUE_BREAKDOWN.map((item) => (
              <div key={item.source} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <span className="text-sm">{item.source}</span>
                <span className="text-sm font-medium text-green-400">${(item.amount / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
