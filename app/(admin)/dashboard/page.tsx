import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  KeyRound, Monitor, Users, Activity, AlertTriangle,
  Crown, Coins, Gem, Shield, Sparkles,
  CheckCircle2, XCircle, Clock,
  Star, BarChart3, Zap, Briefcase,
  GraduationCap, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { EXPIRING_SOON_DAYS, PREMIUM_PLANS, PLAN_PRICES } from "@/lib/constants";
import { ALL_PLANS, PLAN_META } from "@/lib/premium";
import { daysUntil, formatDate, formatNumber, cn } from "@/lib/shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard" };

const colorConfig: Record<string, { text: string; border: string; bg: string; badge: string }> = {
  zinc:   { text: "text-zinc-400", border: "border-zinc-500/20", bg: "bg-zinc-500/10", badge: "bg-zinc-500/20 text-zinc-300" },
  green:  { text: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/10", badge: "bg-green-500/20 text-green-300" },
  blue:   { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", badge: "bg-blue-500/20 text-blue-300" },
  purple: { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10", badge: "bg-purple-500/20 text-purple-300" },
  amber:  { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", badge: "bg-amber-500/20 text-amber-300" },
  red:    { text: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10", badge: "bg-red-500/20 text-red-300" },
  cyan:   { text: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/10", badge: "bg-cyan-500/20 text-cyan-300" },
};

export default async function DashboardPage() {
  const [licenses, activations, auditLogs, teamMembers, roles, securityPolicies, premiumSubs, coinBalances, gemBalances] = await Promise.all([
    prisma.license.findMany({ include: { activations: true } }),
    prisma.activation.findMany(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.teamMember.findMany(),
    prisma.role.findMany(),
    prisma.securityPolicy.findMany(),
    prisma.premiumSubscription.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.coinBalance.findMany({ include: { license: { select: { organization: true } } } }),
    prisma.gemBalance.findMany({ include: { license: { select: { organization: true } } } }),
  ]);

  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const suspendedLicenses = licenses.filter((l) => l.status === "SUSPENDED").length;
  const totalDevices = activations.length;
  const totalCapacity = licenses.reduce((t, l) => t + l.maxDevices, 0);
  const utilization = totalCapacity === 0 ? 0 : Math.round((totalDevices / totalCapacity) * 100);
  const expiringSoon = licenses.filter((l) => daysUntil(l.expiresAt) >= 0 && daysUntil(l.expiresAt) <= EXPIRING_SOON_DAYS).length;
  const expiredActual = licenses.filter((l) => l.expiresAt < new Date()).length;

  const totalCoins = coinBalances.reduce((s, c) => s + c.balance, 0);
  const totalGems = gemBalances.reduce((s, g) => s + g.balance, 0);
  const premiumOrgs = licenses.filter((l) => PREMIUM_PLANS.includes(l.plan as typeof PREMIUM_PLANS[number])).length;
  const premiumRate = licenses.length > 0 ? Math.round((premiumOrgs / licenses.length) * 100) : 0;

  const activePolicies = securityPolicies.filter((p) => p.enabled).length;
  const todayLogins = auditLogs.filter((l) => l.action === "LOGIN_SUCCESS").length;
  const todayErrors = auditLogs.filter((l) => ["LOGIN_FAILURE", "PERMISSION_DENIED"].includes(l.action)).length;

  const planBreakdown = licenses.reduce<Record<string, number>>((acc, l) => {
    acc[l.plan] = (acc[l.plan] || 0) + 1;
    return acc;
  }, {});

  const criticalAlerts: { icon: typeof AlertTriangle; label: string; value: string | number; color: string }[] = [];
  if (suspendedLicenses > 0) criticalAlerts.push({ icon: AlertTriangle, label: "Suspended Licenses", value: suspendedLicenses, color: "text-yellow-400" });
  if (expiredActual > 0) criticalAlerts.push({ icon: AlertTriangle, label: "Expired Licenses", value: expiredActual, color: "text-red-400" });
  if (expiringSoon > 0) criticalAlerts.push({ icon: Clock, label: "Expiring Soon", value: expiringSoon, color: "text-yellow-400" });

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

      <StatCardGrid columns={6}>
        <StatCard title="Total Licenses" value={licenses.length} icon={KeyRound} color="blue" subtitle={`${activeLicenses} active · ${suspendedLicenses} suspended`} />
        <StatCard title="Active Devices" value={totalDevices} icon={Monitor} color="green" subtitle={`${utilization}% of ${formatNumber(totalCapacity)} capacity`} />
        <StatCard title="Team Members" value={teamMembers.length} icon={Users} color="purple" subtitle={`${roles.length} roles configured`} />
        <StatCard title="Premium Rate" value={`${premiumRate}%`} icon={Crown} color="yellow" subtitle={`${premiumOrgs} of ${licenses.length} orgs`} />
        <StatCard title="Total Coins" value={formatNumber(totalCoins)} icon={Coins} color="blue" subtitle={`${coinBalances.length} active wallets`} />
        <StatCard title="Total Gems" value={formatNumber(totalGems)} icon={Gem} color="purple" subtitle={`${gemBalances.length} active wallets`} />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Activity</h2>
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
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Today</h2>
              <Link href="/audit-logs" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Details →
              </Link>
            </div>
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
                <span className="text-sm font-semibold text-green-400">{activePolicies}/{securityPolicies.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Premium Plans</h2>
              <Link href="/premium" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {ALL_PLANS.map((plan) => {
                const meta = PLAN_META[plan];
                const c = colorConfig[meta?.color || "zinc"] || colorConfig.zinc;
                const count = planBreakdown[plan] || 0;
                const price = PLAN_PRICES[plan];
                const Icon = meta?.icon || Star;
                return (
                  <div key={plan} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-2.5 transition-colors hover:bg-zinc-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", c.bg)}>
                        <Icon size={14} className={c.text} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-zinc-200">{meta?.label || plan}</span>
                          {meta?.badge && (
                            <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider", c.badge)}>
                              {meta.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-600">Tier {meta?.tier !== undefined ? meta.tier + 1 : "—"} · {price !== undefined ? `$${price}/mo` : "—"}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-sm font-semibold text-zinc-100">{count}</span>
                      <p className="text-[10px] text-zinc-600">licenses</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/premium/plan-overview"
            className="group flex items-center justify-between rounded-3xl border border-zinc-800 bg-gradient-to-br from-purple-950/30 to-blue-950/30 p-5 transition-all hover:border-purple-700/50 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Sparkles size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Plan Overview</h3>
                <p className="text-xs text-zinc-500">Unified plan center</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-zinc-600 transition-all group-hover:text-purple-400 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/licenses", icon: KeyRound, label: "Manage Licenses", desc: "Create, edit and monitor licenses", color: "text-blue-400", bg: "bg-blue-500/10" },
            { href: "/premium", icon: Crown, label: "Premium Subscriptions", desc: "Grant, extend and manage premium", color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { href: "/coins", icon: Coins, label: "Coin Economy", desc: "Manage virtual currency balances", color: "text-purple-400", bg: "bg-purple-500/10" },
            { href: "/system-health", icon: Activity, label: "System Health", desc: "Monitor performance and uptime", color: "text-green-400", bg: "bg-green-500/10" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-zinc-700 hover:-translate-y-0.5"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.bg}`}>
                  <Icon size={24} className={action.color} />
                </div>
                <h3 className="mt-4 font-semibold">{action.label}</h3>
                <p className="mt-1 text-sm text-zinc-500">{action.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
