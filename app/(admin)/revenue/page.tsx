export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { Tooltip } from "@/components/ui/Tooltip";
import { CreditCard, TrendingUp, Crown, TrendingDown, Activity } from "lucide-react";
import { formatDate } from "@/lib/shared";

export default async function RevenuePage() {
  const [licenses, premiumSubs] = await Promise.all([
    prisma.license.findMany(),
    prisma.premiumSubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const premiumLicenses = licenses.filter((l) => ["ENTERPRISE", "LIFETIME", "BUSINESS"].includes(l.plan)).length;
  const premiumRate = licenses.length > 0 ? Math.round((premiumLicenses / licenses.length) * 100) : 0;

  const planDist = licenses.reduce(
    (acc, l) => {
      acc[l.plan] = (acc[l.plan] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalSubs = premiumSubs.length;
  const revokes = premiumSubs.filter((s) => s.action === "REVOKED").length;
  const extensions = premiumSubs.filter((s) => s.action === "EXTENDED").length;
  const churnRate = totalSubs > 0 ? Math.round((revokes / totalSubs) * 100) : 0;

  const monthlySubs: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const count = premiumSubs.filter(
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

      <StatCardGrid columns={5}>
        <StatCard title="Total Licenses" value={licenses.length} icon={CreditCard} color="blue" subtitle={`${activeLicenses} active`} />
        <StatCard title="Premium Licenses" value={premiumLicenses} icon={Crown} color="yellow" subtitle={`${premiumRate}% premium rate`} />
        <StatCard title="Conversion" value={`${conversionRate}%`} icon={TrendingUp} color="green" subtitle="Free → Premium" />
        <Tooltip content="Revokes / Total subscriptions">
          <StatCard title="Churn Rate" value={`${churnRate}%`} icon={TrendingDown} color={churnRate > 10 ? "red" : "green"} subtitle={`${revokes} revoked`} />
        </Tooltip>
        <StatCard title="Extensions" value={extensions} icon={Activity} color="purple" subtitle="Premium extensions" />
      </StatCardGrid>

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
                const isPremium = ["ENTERPRISE", "LIFETIME", "BUSINESS"].includes(plan);
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
