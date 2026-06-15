export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Crown, Users, TrendingUp, DollarSign } from "lucide-react";

export default async function PremiumPage() {
  const licenses = await prisma.license.findMany();
  const premiumLicenses = licenses.filter((l) => l.plan === "ENTERPRISE" || l.plan === "LIFETIME" || l.plan === "BUSINESS");
  const conversionRate = licenses.length > 0 ? Math.round((premiumLicenses.length / licenses.length) * 100) : 0;

  const planBreakdown = licenses.reduce<Record<string, number>>((acc, l) => {
    acc[l.plan] = (acc[l.plan] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader title="Premium Subscriptions" description="Manage premium plans, conversions and subscription metrics." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Premium" value={premiumLicenses.length} icon={Crown} color="purple" subtitle="ENTERPRISE + LIFETIME + BUSINESS" />
        <StatCard title="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} color="green" />
        <StatCard title="Total Licenses" value={licenses.length} icon={Users} color="blue" />
        <StatCard title="Avg. Revenue" value="$--" icon={DollarSign} color="yellow" subtitle="Coming soon" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Plan Distribution</h2>
          <div className="space-y-3">
            {Object.entries(planBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([plan, count]) => {
                const isPremium = ["ENTERPRISE", "LIFETIME", "BUSINESS"].includes(plan);
                return (
                  <div key={plan} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isPremium && <Crown size={16} className="text-yellow-400" />}
                      <span className="text-sm font-medium">{plan}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-700">
                        <div className={`h-full rounded-full ${isPremium ? "bg-yellow-500" : "bg-blue-500"}`}
                          style={{ width: `${(count / licenses.length) * 100}%` }} />
                      </div>
                      <span className="text-sm text-zinc-400">{count}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Subscription Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">Premium Licenses</span>
              <span className="font-medium">{premiumLicenses.length}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">Standard Licenses</span>
              <span className="font-medium">{licenses.length - premiumLicenses.length}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">Conversion Rate</span>
              <span className="font-medium text-green-400">{conversionRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
