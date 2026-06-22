import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  KeyRound, Monitor, Users, Activity, AlertTriangle,
  Crown, Coins, Gem, Shield,
  CheckCircle2, XCircle, Clock,
  Lock, BarChart3, DollarSign,
  TrendingUp, Layers, Server,
  UserPlus, Gift, FileText, Globe,
  ArrowRight, Sparkles,
} from "lucide-react";
import { getAppEnvironment } from "@/lib/env";
import Link from "next/link";
import { EXPIRING_SOON_DAYS, PLAN_PRICES } from "@/lib/constants";
import { ALL_PLANS, PLAN_META } from "@/lib/premium";
import { daysUntil, formatDate, formatNumber, formatPrice, cn } from "@/lib/shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

const colorConfig: Record<string, { text: string; border: string; bg: string; badge: string; gradient: string }> = {
  zinc:   { text: "text-zinc-400", border: "border-zinc-500/20", bg: "bg-zinc-500/10", badge: "bg-zinc-500/20 text-zinc-300", gradient: "from-zinc-500/10 to-transparent" },
  green:  { text: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/10", badge: "bg-green-500/20 text-green-300", gradient: "from-green-500/10 to-transparent" },
  blue:   { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", badge: "bg-blue-500/20 text-blue-300", gradient: "from-blue-500/10 to-transparent" },
  purple: { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10", badge: "bg-purple-500/20 text-purple-300", gradient: "from-purple-500/10 to-transparent" },
  amber:  { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", badge: "bg-amber-500/20 text-amber-300", gradient: "from-amber-500/10 to-transparent" },
  red:    { text: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10", badge: "bg-red-500/20 text-red-300", gradient: "from-red-500/10 to-transparent" },
  cyan:   { text: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/10", badge: "bg-cyan-500/20 text-cyan-300", gradient: "from-cyan-500/10 to-transparent" },
  emerald: { text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10", badge: "bg-emerald-500/20 text-emerald-300", gradient: "from-emerald-500/10 to-transparent" },
};

function InsightCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-zinc-800 bg-zinc-900 p-6 ${className || ""}`}>
      <h2 className="mb-4 text-base font-bold text-zinc-100">{title}</h2>
      {children}
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-800/40 px-3 py-2">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className={`text-sm font-semibold ${color || "text-zinc-100"}`}>{value}</span>
    </div>
  );
}

function MetricsRow({ items }: { items: { label: string; value: string | number; icon: typeof Shield; color: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-xl bg-zinc-800/40 p-3">
            <div className="flex items-center gap-2">
              <Icon size={14} className={item.color} />
              <span className="text-[11px] text-zinc-500">{item.label}</span>
            </div>
            <p className={`mt-1 text-lg font-bold ${item.color}`}>{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    licenses, activationCounts, auditLogs, memberCounts, roleCount,
    policyCounts, premiumSubs, coinStats, gemStats, promoStats,
    invoiceStats, activeSessionCount, overriddenSessionCount, sessionsExpiringSoonCount,
    paidInvoices, outstandingInvoices, draftInvoices, todayLogins, todayErrors,
    activePromotionsCount, activePoliciesCount, totalPremiumSubs, totalSessionCount,
  ] = await Promise.all([
    prisma.license.findMany({ select: { status: true, expiresAt: true, maxDevices: true, plan: true, organization: true } }),
    prisma.activation.groupBy({ by: ["status"], _count: true }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.teamMember.groupBy({ by: ["status"], _count: true }),
    prisma.role.count(),
    prisma.securityPolicy.count(),
    prisma.premiumSubscription.findMany({ where: { endDate: { gt: now }, action: { notIn: ["REVOKED", "CANCELLED"] } }, select: { id: true, licenseId: true } }),
    prisma.coinBalance.aggregate({ _sum: { balance: true }, _count: true }),
    prisma.gemBalance.aggregate({ _sum: { balance: true }, _count: true }),
    prisma.promotion.aggregate({ _sum: { usedCount: true }, _count: true }),
    prisma.invoice.aggregate({ _sum: { total: true }, _count: true }),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.session.count({ where: { overrideDurationMinutes: { not: null } } }),
    prisma.session.count({ where: { expiresAt: { gt: now, lte: thirtyDaysFromNow } } }),
    prisma.invoice.count({ where: { status: "PAID" } }),
    prisma.invoice.count({ where: { status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.invoice.count({ where: { status: "DRAFT" } }),
    prisma.auditLog.count({ where: { action: "LOGIN_SUCCESS", createdAt: { gte: startOfToday } } }),
    prisma.auditLog.count({ where: { action: { in: ["LOGIN_FAILURE", "PERMISSION_DENIED"] }, createdAt: { gte: startOfToday } } }),
    prisma.promotion.count({ where: { active: true } }),
    prisma.securityPolicy.count({ where: { enabled: true } }),
    prisma.premiumSubscription.count(),
    prisma.session.count(),
  ]);

  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const suspendedLicenses = licenses.filter((l) => l.status === "SUSPENDED").length;
  const expiredLicenses = licenses.filter((l) => l.status === "EXPIRED").length;
  const expiringSoon = licenses.filter((l) => l.expiresAt >= now && l.expiresAt <= thirtyDaysFromNow).length;
  const pendingLicenses = licenses.filter((l) => l.status === "PENDING").length;
  const totalCapacity = licenses.reduce((t, l) => t + l.maxDevices, 0);
  const totalDevices = activationCounts.reduce((s, g) => s + g._count, 0);
  const utilization = totalCapacity === 0 ? 0 : Math.round((totalDevices / totalCapacity) * 100);
  const memberCountMap = Object.fromEntries(memberCounts.map((g) => [g.status, g._count]));
  const totalMembers = memberCounts.reduce((s, g) => s + g._count, 0);
  const activeMembers = memberCountMap["ACTIVE"] || 0;
  const suspendedMembers = memberCountMap["SUSPENDED"] || 0;
  const pendingMembers = memberCountMap["PENDING"] || 0;
  const activePremiumSubs = premiumSubs.length;
  const planBreakdown = licenses.reduce<Record<string, number>>((acc, l) => {
    acc[l.plan] = (acc[l.plan] || 0) + 1;
    return acc;
  }, {});
  const totalPromos = promoStats._count;
  const totalRedemptions = promoStats._sum.usedCount || 0;
  const totalInvoices = invoiceStats._count;
  const invoiceRevenue = invoiceStats._sum.total || 0;
  const activationStatusMap = Object.fromEntries(activationCounts.map((g) => [g.status, g._count]));
  const trustedDevices = activationStatusMap["ACTIVE"] || 0;
  const suspendedDevices = activationStatusMap["SUSPENDED"] || 0;
  const pendingDevices = activationStatusMap["PENDING"] || 0;
  const totalCoins = coinStats._sum.balance || 0;
  const totalCoinsWallets = coinStats._count;
  const totalGems = gemStats._sum.balance || 0;
  const totalGemsWallets = gemStats._count;
  const totalPolicies = policyCounts;
  const rolesCount = roleCount;
  const uniqueOrgs = new Set(licenses.map((l) => l.organization)).size;

  /* ── Alerts ── */
  const criticalAlerts: { icon: typeof Shield; label: string; value: string | number; color: string }[] = [];
  if (suspendedLicenses > 0) criticalAlerts.push({ icon: AlertTriangle, label: "Suspended Licenses", value: suspendedLicenses, color: "text-yellow-400" });
  if (expiredLicenses > 0) criticalAlerts.push({ icon: AlertTriangle, label: "Expired Licenses", value: expiredLicenses, color: "text-red-400" });
  if (expiringSoon > 0) criticalAlerts.push({ icon: Clock, label: "Expiring Soon", value: expiringSoon, color: "text-yellow-400" });
  if (suspendedMembers > 0) criticalAlerts.push({ icon: AlertTriangle, label: "Suspended Members", value: suspendedMembers, color: "text-yellow-400" });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Monitor platform health, security and growth in real time."
      />

      {criticalAlerts.length > 0 && (
        <div className="rounded-3xl border border-yellow-800/50 bg-yellow-500/5 p-5">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle size={18} />
            <h3 className="font-semibold">Critical Alerts</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {criticalAlerts.map((alert, i) => {
              const Icon = alert.icon;
              return (
                <div key={alert.label || i} className="flex items-center gap-2 rounded-xl bg-zinc-800/50 px-4 py-2">
                  <Icon size={16} className={alert.color} />
                  <span className="text-sm text-zinc-400">{alert.label}:</span>
                  <span className={`text-sm font-semibold ${alert.color}`}>{alert.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Overview Stats ── */}
      <StatCardGrid columns={6}>
        <StatCard title="Team Members" value={totalMembers} icon={Users} color="blue"
          subtitle={`${activeMembers} active · ${suspendedMembers} suspended`} />
        <StatCard title="Licenses" value={licenses.length} icon={KeyRound} color="purple"
          subtitle={`${activeLicenses} active · ${expiringSoon} expiring soon`} />
        <StatCard title="Active Devices" value={totalDevices} icon={Monitor} color="green"
          subtitle={`${utilization}% of ${formatNumber(totalCapacity)} capacity`} />
        <StatCard title="Premium" value={activePremiumSubs} icon={Crown} color="yellow"
          subtitle={`${totalPremiumSubs} total subscriptions`} />
        <StatCard title="Coins" value={formatNumber(totalCoins)} icon={Coins} color="blue"
          subtitle={`${totalCoinsWallets} active wallets`} />
        <StatCard title="Gems" value={formatNumber(totalGems)} icon={Gem} color="purple"
          subtitle={`${totalGemsWallets} active wallets`} />
      </StatCardGrid>

      {/* ── Premium Plans ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-100">Premium Plans</h2>
          <Link href="/premium" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Manage Plans →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {ALL_PLANS.map((plan) => {
            const meta = PLAN_META[plan];
            const c = colorConfig[meta?.color || "zinc"] || colorConfig.zinc;
            const count = planBreakdown[plan] || 0;
            const price = PLAN_PRICES[plan];
            const Icon = meta?.icon || (() => null);
            return (
              <div key={plan} className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-700">
                <div className={`absolute inset-0 bg-gradient-to-b ${c.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", c.bg)}>
                      <Icon size={12} className={c.text} />
                    </div>
                    <span className="text-xs font-medium text-zinc-300">{meta?.label || plan}</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-zinc-100">{count}</span>
                    <span className="text-[10px] text-zinc-600">licenses</span>
                  </div>
                  {meta?.badge && (
                    <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider", c.badge)}>
                      {meta.badge}
                    </span>
                  )}
                  {price !== undefined && (
                    <p className="mt-1 text-[10px] text-zinc-600">{formatPrice(price, "$")}/mo</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Plan Overview ── */}
      <Link
        href="/premium/plan-overview"
        className="group relative block w-full overflow-visible rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.07] to-transparent p-6 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-[0_0_40px_-8px_rgba(168,85,247,0.2)]"
      >
        <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400 shadow-lg shadow-purple-500/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-purple-500/20">
              <Sparkles size={26} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-zinc-100 group-hover:text-purple-100 transition-colors">Plan Overview</h2>
              <p className="mt-1 text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                Compare Premium Plans, Coin Packages, Gem Packages and License Packages
              </p>
            </div>
          </div>
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 transition-all duration-300 group-hover:bg-purple-500/20 group-hover:scale-110">
            <ArrowRight size={18} />
          </div>
        </div>
      </Link>

      {/* ── Executive Insights ── */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-zinc-100">Executive Insights</h2>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {/* Business Overview */}
          <InsightCard title="Business Overview">
            <MetricsRow items={[
              { label: "Organizations", value: uniqueOrgs, icon: Globe, color: "text-blue-400" },
              { label: "Team Members", value: totalMembers, icon: Users, color: "text-green-400" },
              { label: "Active Licenses", value: activeLicenses, icon: KeyRound, color: "text-purple-400" },
              { label: "Active Devices", value: trustedDevices, icon: Monitor, color: "text-emerald-400" },
            ]} />
          </InsightCard>

          {/* Revenue Snapshot */}
          <InsightCard title="Revenue Snapshot">
            <MetricsRow items={[
              { label: "Invoice Revenue", value: formatPrice(invoiceRevenue / 100, "$"), icon: DollarSign, color: "text-emerald-400" },
              { label: "Paid Invoices", value: paidInvoices, icon: CheckCircle2, color: "text-green-400" },
              { label: "Outstanding", value: outstandingInvoices, icon: Clock, color: "text-amber-400" },
              { label: "Drafts", value: draftInvoices, icon: FileText, color: "text-zinc-400" },
            ]} />
          </InsightCard>

          {/* Subscription Health */}
          <InsightCard title="Subscription Health">
            <MetricsRow items={[
              { label: "Active Subscriptions", value: activePremiumSubs, icon: Crown, color: "text-yellow-400" },
              { label: "Total Subscriptions", value: totalPremiumSubs, icon: Layers, color: "text-blue-400" },
              { label: "Active Rate", value: `${totalPremiumSubs > 0 ? Math.round(activePremiumSubs / totalPremiumSubs * 100) : 0}%`, icon: TrendingUp, color: "text-green-400" },
              { label: "Plan Tiers", value: ALL_PLANS.length, icon: BarChart3, color: "text-purple-400" },
            ]} />
          </InsightCard>

          {/* License Health */}
          <InsightCard title="License Health">
            <MetricsRow items={[
              { label: "Active", value: activeLicenses, icon: CheckCircle2, color: "text-green-400" },
              { label: "Expiring Soon", value: expiringSoon, icon: Clock, color: expiringSoon > 0 ? "text-amber-400" : "text-zinc-500" },
              { label: "Suspended", value: suspendedLicenses, icon: XCircle, color: suspendedLicenses > 0 ? "text-red-400" : "text-zinc-500" },
              { label: "Pending", value: pendingLicenses, icon: Clock, color: pendingLicenses > 0 ? "text-blue-400" : "text-zinc-500" },
            ]} />
          </InsightCard>
        </div>
      </div>

      {/* ── Secondary Insight Grid ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Invoice Overview */}
        <InsightCard title="Invoice Overview">
          <div className="space-y-2">
            <StatRow label="Total Invoices" value={totalInvoices} color="text-blue-400" />
            <StatRow label="Revenue" value={`${formatPrice(invoiceRevenue / 100, "$")}`} color="text-emerald-400" />
            <StatRow label="Paid" value={paidInvoices} color="text-green-400" />
            <StatRow label="Outstanding" value={outstandingInvoices} color={outstandingInvoices > 0 ? "text-red-400" : "text-zinc-500"} />
            <StatRow label="Draft" value={draftInvoices} color="text-zinc-400" />
          </div>
        </InsightCard>

        {/* Promotion Performance */}
        <InsightCard title="Promotion Performance">
          <div className="space-y-2">
            <StatRow label="Active Campaigns" value={activePromotionsCount} color="text-green-400" />
            <StatRow label="Total Promotions" value={totalPromos} color="text-blue-400" />
            <StatRow label="Total Redemptions" value={totalRedemptions} color="text-amber-400" />
          </div>
        </InsightCard>

        {/* Session Activity */}
        <InsightCard title="Session Activity">
          <div className="space-y-2">
            <StatRow label="Active Sessions" value={activeSessionCount} color="text-blue-400" />
            <StatRow label="Policy Overrides" value={overriddenSessionCount} color={overriddenSessionCount > 0 ? "text-amber-400" : "text-zinc-500"} />
            <StatRow label="Expiring ≤30d" value={sessionsExpiringSoonCount} color={sessionsExpiringSoonCount > 0 ? "text-amber-400" : "text-zinc-500"} />
            <StatRow label="Override Rate" value={`${activeSessionCount > 0 ? Math.round(overriddenSessionCount / activeSessionCount * 100) : 0}%`} color="text-zinc-400" />
          </div>
        </InsightCard>

        {/* Device Trust Summary */}
        <InsightCard title="Device Trust Summary">
          <div className="space-y-2">
            <StatRow label="Trusted" value={trustedDevices} color="text-green-400" />
            <StatRow label="Suspended" value={suspendedDevices} color={suspendedDevices > 0 ? "text-red-400" : "text-zinc-500"} />
            <StatRow label="Pending Review" value={pendingDevices} color={pendingDevices > 0 ? "text-amber-400" : "text-zinc-500"} />
            <StatRow label="Total Capacity" value={formatNumber(totalCapacity)} color="text-blue-400" />
            <StatRow label="Utilization" value={`${utilization}%`} color="text-emerald-400" />
          </div>
        </InsightCard>

        {/* Team Member Overview */}
        <InsightCard title="Team Member Overview">
          <div className="space-y-2">
            <StatRow label="Total" value={totalMembers} color="text-blue-400" />
            <StatRow label="Active" value={`${activeMembers} (${totalMembers > 0 ? Math.round(activeMembers / totalMembers * 100) : 0}%)`} color="text-green-400" />
            <StatRow label="Suspended" value={suspendedMembers} color={suspendedMembers > 0 ? "text-red-400" : "text-zinc-500"} />
            <StatRow label="Pending" value={pendingMembers} color={pendingMembers > 0 ? "text-amber-400" : "text-zinc-500"} />
            <StatRow label="Roles Configured" value={rolesCount} color="text-purple-400" />
          </div>
        </InsightCard>

        {/* Organization Overview */}
        <InsightCard title="Organization Overview">
          <div className="space-y-2">
            <StatRow label="Total Organizations" value={uniqueOrgs} color="text-blue-400" />
            <StatRow label="Avg Members/Org" value={uniqueOrgs > 0 ? (totalMembers / uniqueOrgs).toFixed(1) : "—"} color="text-green-400" />
            <StatRow label="Avg Licenses/Org" value={uniqueOrgs > 0 ? (licenses.length / uniqueOrgs).toFixed(1) : "—"} color="text-purple-400" />
            <StatRow label="Orgs w/ Premium" value={new Set(premiumSubs.map((s) => s.licenseId)).size} color="text-yellow-400" />
            <StatRow label="Total Capacity" value={formatNumber(totalCapacity)} color="text-emerald-400" />
          </div>
        </InsightCard>

        {/* System Health */}
        <InsightCard title="System Health">
          <div className="space-y-2">
            <StatRow label="Security Policies" value={`${activePoliciesCount}/${totalPolicies} active`} color="text-green-400" />
            <StatRow label="Today Logins" value={todayLogins} color="text-blue-400" />
            <StatRow label="Today Errors" value={todayErrors} color={todayErrors > 0 ? "text-red-400" : "text-zinc-500"} />
            <StatRow label="Roles Configured" value={rolesCount} color="text-purple-400" />
            <StatRow label="Environment" value={getAppEnvironment() === "development" ? "Development" : getAppEnvironment() === "staging" ? "Staging" : "Production"} color={getAppEnvironment() === "development" ? "text-amber-400" : "text-emerald-400"} />
          </div>
        </InsightCard>

        {/* Coins & Gems */}
        <InsightCard title="Coins & Gems">
          <div className="space-y-2">
            <StatRow label="Total Coins" value={formatNumber(totalCoins)} color="text-blue-400" />
            <StatRow label="Active Coin Wallets" value={totalCoinsWallets} color="text-cyan-400" />
            <StatRow label="Total Gems" value={formatNumber(totalGems)} color="text-purple-400" />
            <StatRow label="Active Gem Wallets" value={totalGemsWallets} color="text-violet-400" />
            <StatRow label="Avg Coins/Wallet" value={totalCoinsWallets > 0 ? formatNumber(Math.round(totalCoins / totalCoinsWallets)) : "—"} color="text-zinc-400" />
          </div>
        </InsightCard>
      </div>

      {/* ── Activity + Today ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-zinc-100">Recent Activity</h2>
            <Link href="/audit-logs" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
          {auditLogs.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Actions will appear here as they occur."
              className="border-0 bg-transparent p-8"
            />
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="truncate text-sm text-zinc-400">
                      {log.description || log.actorName || "-"}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-600">
                    {formatDate(log.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <InsightCard title="Today">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <span className="text-sm text-zinc-300">Logins</span>
                </div>
                <span className="text-sm font-semibold text-green-400">{todayLogins}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <XCircle size={16} className="text-red-400" />
                  <span className="text-sm text-zinc-300">Errors</span>
                </div>
                <span className="text-sm font-semibold text-red-400">{todayErrors}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-green-400" />
                  <span className="text-sm text-zinc-300">Policies Active</span>
                </div>
                <span className="text-sm font-semibold text-green-400">{activePoliciesCount}/{totalPolicies}</span>
              </div>
            </div>
          </InsightCard>

          <InsightCard title="Quick Stats">
            <div className="space-y-2">
              <StatRow label="Total Members" value={totalMembers} color="text-blue-400" />
              <StatRow label="Total Licenses" value={licenses.length} color="text-purple-400" />
              <StatRow label="Total Invoices" value={totalInvoices} color="text-emerald-400" />
              <StatRow label="Total Sessions" value={totalSessionCount} color="text-amber-400" />
            </div>
          </InsightCard>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-zinc-100">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/premium?action=grant", icon: Crown, label: "Grant Premium", desc: "Grant or extend premium subscriptions", color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { href: "/licenses/create", icon: KeyRound, label: "Create License", desc: "Issue new license keys", color: "text-purple-400", bg: "bg-purple-500/10" },
            { href: "/settings/team-members", icon: UserPlus, label: "Invite Member", desc: "Add team members and assign roles", color: "text-blue-400", bg: "bg-blue-500/10" },
            { href: "/offers/create", icon: Gift, label: "Create Promo Code", desc: "Launch promotional campaigns", color: "text-amber-400", bg: "bg-amber-500/10" },
            { href: "/invoices", icon: FileText, label: "Open Invoices", desc: "View and manage billing invoices", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { href: "/sessions", icon: Lock, label: "Manage Sessions", desc: "Monitor and control active sessions", color: "text-red-400", bg: "bg-red-500/10" },
            { href: "/audit-logs", icon: Activity, label: "View Analytics", desc: "Review audit trails and activity", color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { href: "/system-health", icon: Server, label: "System Health", desc: "Monitor performance and uptime", color: "text-green-400", bg: "bg-green-500/10" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-zinc-700 hover:-translate-y-0.5"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.bg} transition-all group-hover:scale-110`}>
                  <Icon size={24} className={action.color} />
                </div>
                <h3 className="mt-4 font-semibold text-zinc-100">{action.label}</h3>
                <p className="mt-1 text-sm text-zinc-500">{action.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
