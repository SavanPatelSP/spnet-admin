import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Premium Management" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { Crown, CalendarDays, Clock, ClipboardList, Download, Tags, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { PREMIUM_PLANS, EXPIRING_SOON_DAYS } from "@/lib/constants";
import { formatDateTime, daysUntil } from "@/lib/shared";
import GrantPremiumModal from "@/components/premium/GrantPremiumModal";
import { PremiumTable } from "@/components/premium/PremiumTable";
import { PremiumAnalytics } from "@/components/premium/PremiumAnalytics";
import { PremiumHistoryTable } from "@/components/premium/PremiumHistoryTable";
import PremiumRequestActions from "@/components/premium/PremiumRequestActions";
import Link from "next/link";

export default async function PremiumPage() {
  await requirePermission("View Premium");
  const [licenses, allSubscriptions, requestCounts, premiumRequests, allRequests] = await Promise.all([
    prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, key: true, organization: true, plan: true, status: true, expiresAt: true, maxDevices: true, _count: { select: { activations: true } } },
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
    prisma.premiumRequest.findMany({
      orderBy: { submittedAt: "desc" },
      take: 500,
      include: {
        license: { select: { organization: true, key: true, plan: true } },
      },
    }),
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

  const availableForGrant = licenses.map((l) => ({
    id: l.id,
    key: l.key,
    organization: l.organization,
  }));

  const pendingRequests = requestCounts.find((r) => r.status === "PENDING")?._count.id || 0;
  const approvedRequests = requestCounts.find((r) => r.status === "APPROVED")?._count.id || 0;
  const rejectedRequests = requestCounts.find((r) => r.status === "REJECTED")?._count.id || 0;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    EXPIRED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title="Premium Subscriptions"
        description="Enterprise subscription operations center"
        actions={
          <Link
            href="/premium/plan-overview"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-purple-500 hover:to-blue-500 max-sm:px-3 max-sm:py-2"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">Plan Overview</span>
            <span className="sm:hidden">Overview</span>
          </Link>
        }
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

      <div>
        <h2 className="mb-5 text-xl font-bold text-zinc-100">Premium Requests</h2>
        <DataTable
          columns={[
            { key: "submittedAt", label: "Submitted", sortable: true },
            { key: "organization", label: "Organization", sortable: true, searchable: true },
            { key: "licenseKey", label: "License", sortable: true, searchable: true },
            { key: "requestedPlan", label: "Plan", sortable: true },
            { key: "duration", label: "Duration", sortable: true },
            { key: "reason", label: "Reason", searchable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "submittedBy", label: "By", sortable: true },
            { key: "reviewedBy", label: "Reviewed", sortable: true },
            { key: "actions", label: "Actions" },
          ]}
          rows={allRequests.map((r) => ({
            id: r.id,
            values: {
              submittedAt: r.submittedAt.toISOString(),
              organization: r.organization || r.license.organization,
              licenseKey: r.license.key,
              requestedPlan: r.requestedPlan,
              duration: `${r.requestedDurationDays} days`,
              reason: r.reason || "-",
              status: r.status,
              submittedBy: r.submittedBy || "-",
              reviewedBy: r.reviewedBy || "-",
            },
            cells: [
              <span key="submittedAt" className="text-sm text-zinc-400">{formatDateTime(r.submittedAt)}</span>,
              <Link key="organization" href={`/licenses/${r.licenseId}`} className="text-sm text-blue-400 hover:underline">
                {r.organization || r.license.organization}
              </Link>,
              <code key="licenseKey" className="text-xs font-mono text-zinc-400">{r.license.key}</code>,
              <span key="plan" className="font-medium">{r.requestedPlan}</span>,
              <span key="duration" className="text-sm text-zinc-400">{r.requestedDurationDays} days</span>,
              <span key="reason" className="text-sm text-zinc-300 max-w-xs truncate">{r.reason || "-"}</span>,
              <span key="status" className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status] || "bg-zinc-500/10 text-zinc-400"}`}>
                {r.status}
              </span>,
              <span key="submittedBy" className="text-sm text-zinc-400">{r.submittedBy || "-"}</span>,
              <span key="reviewedBy" className="text-sm text-zinc-400">{r.reviewedBy || "-"}</span>,
              <PremiumRequestActions
                key={`actions-${r.id}`}
                requestId={r.id}
                licenseId={r.licenseId}
                organization={r.organization || r.license.organization}
                requestedPlan={r.requestedPlan}
                requestedDurationDays={r.requestedDurationDays}
                reason={r.reason}
                status={r.status}
                submittedBy={r.submittedBy}
                licenseKey={r.license.key}
                convertedSubscriptionId={r.convertedSubscriptionId}
              />,
            ],
          }))}
          pageSize={10}
          searchPlaceholder="Search requests..."
          emptyMessage="No premium requests yet."
        />
      </div>

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
            deviceCount: l._count?.activations ?? 0,
            subscriptionType: latestSubData.get(l.id) || undefined,
          }))}
          availableForGrant={availableForGrant}
        />
      </div>

      <div>
        <h2 className="mb-5 text-xl font-bold text-zinc-100">Analytics</h2>
        <PremiumAnalytics
          planBreakdown={planBreakdown}
          subscriptionTypeBreakdown={subscriptionTypeBreakdown}
          totalPremium={premiumLicenses.length}
          premiumLicenses={premiumLicenses.map((l) => ({ plan: l.plan }))}
        />
      </div>

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
