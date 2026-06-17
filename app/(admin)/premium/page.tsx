export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Crown, CalendarDays, Clock, ClipboardList, ArrowUpRight, Download, Tags } from "lucide-react";
import { PREMIUM_PLANS, EXPIRING_SOON_DAYS } from "@/lib/constants";
import { daysUntil } from "@/lib/shared";
import GrantPremiumModal from "@/components/premium/GrantPremiumModal";
import { PremiumTable } from "@/components/premium/PremiumTable";
import { PremiumAnalytics } from "@/components/premium/PremiumAnalytics";
import { PremiumHistoryTable } from "@/components/premium/PremiumHistoryTable";
import Link from "next/link";

export default async function PremiumPage() {
  const [licenses, allSubscriptions, requestCounts, premiumRequests] = await Promise.all([
    prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      include: { activations: true },
    }),
    prisma.premiumSubscription.findMany({
      select: {
        id: true,
        licenseId: true,
        action: true,
        plan: true,
        subscriptionType: true,
        grantedBy: true,
        durationDays: true,
        createdAt: true,
        license: { select: { organization: true, key: true, plan: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    prisma.premiumRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.premiumRequest.findMany({
      where: { submittedBy: { not: null }, organization: { not: null } },
      select: { licenseId: true, submittedBy: true, organization: true },
      orderBy: { submittedAt: "desc" },
      take: 100,
    }).then((rows) => rows.filter((r): r is { licenseId: string; submittedBy: string; organization: string } =>
      r.submittedBy !== null && r.organization !== null
    )),
  ]);

  const history = allSubscriptions;

  const latestSubData = new Map<string, string>();
  const seen = new Set<string>();
  for (const sub of allSubscriptions) {
    if (!seen.has(sub.licenseId)) {
      seen.add(sub.licenseId);
      latestSubData.set(sub.licenseId, sub.subscriptionType);
    }
  }

  const premiumLicenses = licenses.filter((l) => PREMIUM_PLANS.includes(l.plan as never));
  const nonPremiumLicenses = licenses.filter((l) => !PREMIUM_PLANS.includes(l.plan as never));
  const conversionRate = licenses.length > 0 ? Math.round((premiumLicenses.length / licenses.length) * 100) : 0;

  const lifetimeCount = premiumLicenses.filter((l) => latestSubData.get(l.id) === "LIFETIME").length;
  const yearlyCount = premiumLicenses.filter((l) => latestSubData.get(l.id) === "YEARLY").length;
  const monthlyCount = premiumLicenses.filter((l) => latestSubData.get(l.id) === "MONTHLY").length;
  const customCount = premiumLicenses.filter((l) => latestSubData.get(l.id) === "CUSTOM").length;

  const expiringPremium = premiumLicenses.filter((l) => {
    const d = daysUntil(l.expiresAt);
    return d >= 0 && d <= EXPIRING_SOON_DAYS;
  }).length;

  const planBreakdown = licenses.reduce<Record<string, number>>((acc, l) => {
    acc[l.plan] = (acc[l.plan] || 0) + 1;
    return acc;
  }, {});

  const subscriptionTypeBreakdown = [...latestSubData.values()].reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const availableForGrant = nonPremiumLicenses.map((l) => ({
    id: l.id,
    key: l.key,
    organization: l.organization,
  }));

  const pendingRequests = requestCounts.find((r) => r.status === "PENDING")?._count.id || 0;
  const approvedRequests = requestCounts.find((r) => r.status === "APPROVED")?._count.id || 0;
  const rejectedRequests = requestCounts.find((r) => r.status === "REJECTED")?._count.id || 0;

  const requestLicenses = await prisma.premiumRequest.findMany({
    orderBy: { submittedAt: "desc" },
    take: 5,
    include: {
      license: { select: { organization: true, key: true } },
    },
  });

  return (
    <div className="space-y-10">
      {/* Section 1: Executive Overview */}
      <div>
        <PageHeader
          title="Premium Subscriptions"
          description="Enterprise subscription operations center"
        />

        <StatCardGrid columns={4}>
          <StatCard
            title="Active Premium"
            value={premiumLicenses.length}
            icon={Crown}
            color="purple"
            subtitle={`${conversionRate}% of all licenses`}
          />
          <StatCard
            title="Subscription Types"
            value={`${yearlyCount + monthlyCount + lifetimeCount + customCount}`}
            icon={CalendarDays}
            color="blue"
            subtitle={`${yearlyCount} yearly · ${monthlyCount} monthly · ${lifetimeCount} lifetime · ${customCount} custom`}
          />
          <StatCard
            title="Pending Requests"
            value={pendingRequests}
            icon={ClipboardList}
            color={pendingRequests > 0 ? "yellow" : "default"}
            subtitle={pendingRequests > 0 ? `${approvedRequests} approved · ${rejectedRequests} rejected` : "No pending requests"}
          />
          <StatCard
            title="Expiring Soon"
            value={expiringPremium}
            icon={Clock}
            color={expiringPremium > 0 ? "red" : "default"}
            subtitle={`Within ${EXPIRING_SOON_DAYS} days`}
          />
        </StatCardGrid>
      </div>

      {/* Section 2: Quick Actions */}
      <div>
        <h2 className="mb-5 text-xl font-bold text-zinc-100">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <GrantPremiumModal availableLicenses={availableForGrant} requests={premiumRequests} />

          <Link
            href="/premium-requests"
            className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <ClipboardList size={16} className="text-blue-400" />
              </div>
              <span className="text-sm font-medium text-zinc-100">Premium Requests</span>
            </div>
            <span className="text-xs text-zinc-500">
              {pendingRequests > 0 ? `${pendingRequests} pending` : "Manage requests"}
            </span>
          </Link>

          <Link
            href="/reports"
            className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <Download size={16} className="text-green-400" />
              </div>
              <span className="text-sm font-medium text-zinc-100">Export Reports</span>
            </div>
            <span className="text-xs text-zinc-500">Download premium analytics</span>
          </Link>

          <Link
            href="/licenses"
            className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
                <Tags size={16} className="text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-zinc-100">Licenses</span>
            </div>
            <span className="text-xs text-zinc-500">View all licenses</span>
          </Link>
        </div>
      </div>

      {/* Section 3: Premium Requests */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-100">Premium Requests</h2>
          <Link href="/premium-requests" className="flex items-center gap-1 text-sm text-blue-400 hover:underline">
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Pending", count: pendingRequests, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
            { label: "Approved", count: approvedRequests, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
            { label: "Rejected", count: rejectedRequests, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
          ].map((s) => (
            <Link
              key={s.label}
              href={`/premium-requests?status=${s.label.toUpperCase()}`}
              className={`rounded-2xl border ${s.border} ${s.bg} p-5 transition-all hover:scale-[1.02]`}
            >
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="mt-1 text-sm text-zinc-400">{s.label}</p>
            </Link>
          ))}
        </div>
        {requestLicenses.length > 0 && (
          <div className="mt-4 space-y-2">
            {requestLicenses.map((r) => (
              <Link
                key={r.id}
                href="/premium-requests"
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm transition-colors hover:bg-zinc-800"
              >
                <span className="text-zinc-300">{r.license.organization}</span>
                <span className="text-zinc-500">{r.requestedPlan} &middot; {r.requestedDurationDays}d</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Premium Subscriptions */}
      <div>
        <h2 className="mb-5 text-xl font-bold text-zinc-100">Premium Subscriptions</h2>
        <PremiumTable
          licenses={[...premiumLicenses, ...nonPremiumLicenses].map((l) => ({
            id: l.id,
            key: l.key,
            organization: l.organization,
            plan: l.plan,
            status: l.status,
            expiresAt: l.expiresAt,
            maxDevices: l.maxDevices,
            deviceCount: l.activations.length,
            subscriptionType: latestSubData.get(l.id) || undefined,
          }))}
          availableForGrant={availableForGrant}
        />
      </div>

      {/* Section 5: Analytics */}
      <div>
        <h2 className="mb-5 text-xl font-bold text-zinc-100">Analytics</h2>
        <PremiumAnalytics
          planBreakdown={planBreakdown}
          subscriptionTypeBreakdown={subscriptionTypeBreakdown}
          totalPremium={premiumLicenses.length}
          premiumLicenses={premiumLicenses.map((l) => ({ plan: l.plan }))}
        />
      </div>

      {/* Section 6: Timeline */}
      {history.length > 0 && (
        <div>
          <h2 className="mb-5 text-xl font-bold text-zinc-100">Timeline</h2>
          <PremiumHistoryTable
            history={history.map((h) => ({
              id: h.id,
              action: h.action,
              organization: h.license.organization,
              plan: h.plan,
              grantedBy: h.grantedBy,
              createdAt: h.createdAt,
              durationDays: h.durationDays,
            }))}
          />
        </div>
      )}
    </div>
  );
}
