import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  KeyRound, Monitor, Users, Activity, AlertTriangle,
  Crown, Coins, Gem, Shield,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { EXPIRING_SOON_DAYS } from "@/lib/constants";
import { daysUntil, formatDate, formatNumber } from "@/lib/shared";

export const dynamic = "force-dynamic";

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
  const premiumOrgs = licenses.filter((l) => ["ENTERPRISE", "LIFETIME", "BUSINESS"].includes(l.plan)).length;
  const premiumRate = licenses.length > 0 ? Math.round((premiumOrgs / licenses.length) * 100) : 0;

  const criticalAlerts: { icon: typeof AlertTriangle; label: string; value: string | number; color: string }[] = [];
  if (suspendedLicenses > 0) criticalAlerts.push({ icon: AlertTriangle, label: "Suspended Licenses", value: suspendedLicenses, color: "text-yellow-400" });
  if (expiredActual > 0) criticalAlerts.push({ icon: AlertTriangle, label: "Expired Licenses", value: expiredActual, color: "text-red-400" });
  if (expiringSoon > 0) criticalAlerts.push({ icon: Activity, label: "Expiring Soon", value: expiringSoon, color: "text-yellow-400" });

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
        <StatCard title="Total Licenses" value={licenses.length} icon={KeyRound} color="blue" subtitle={`${activeLicenses} active`} />
        <StatCard title="Active Devices" value={totalDevices} icon={Monitor} color="green" subtitle={`${utilization}% capacity used`} />
        <StatCard title="Team Members" value={teamMembers.length} icon={Users} color="purple" subtitle={`${roles.length} roles`} />
        <StatCard title="Premium Rate" value={`${premiumRate}%`} icon={Crown} color="yellow" subtitle={`${premiumOrgs} premium orgs`} />
        <Tooltip content={`${formatNumber(totalCoins)} coins across ${coinBalances.length} licenses`}>
          <StatCard title="Total Coins" value={formatNumber(totalCoins)} icon={Coins} color="blue" subtitle={`${coinBalances.length} balances`} />
        </Tooltip>
        <Tooltip content={`${formatNumber(totalGems)} gems across ${gemBalances.length} licenses`}>
          <StatCard title="Total Gems" value={formatNumber(totalGems)} icon={Gem} color="blue" subtitle={`${gemBalances.length} balances`} />
        </Tooltip>
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Link
          href="/settings"
          className="group col-span-full rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 transition-all hover:border-zinc-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Enterprise Control Center</h2>
              <p className="mt-1 text-zinc-400">
                {licenses.length} licenses · {teamMembers.length} members · {roles.length} roles · {securityPolicies.length} security policies
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
                {securityPolicies.filter((p) => p.enabled).length}/{securityPolicies.length} Policies Active
              </div>
              <ExternalLink size={16} className="text-zinc-600 transition-colors group-hover:text-zinc-400" />
            </div>
          </div>
        </Link>

        <div className="col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <Link href="/audit-logs" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">No recent activity.</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                      {log.action}
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

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Premium Activity</h2>
            <Link href="/premium" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
          {premiumSubs.length === 0 ? (
            <p className="text-sm text-zinc-500">No premium activity.</p>
          ) : (
            <div className="space-y-2">
              {premiumSubs.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Crown size={14} className="shrink-0 text-yellow-400" />
                    <span className="truncate text-sm text-zinc-300">{sub.plan}</span>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">{sub.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { href: "/licenses", icon: KeyRound, label: "Manage Licenses", desc: "Create, edit and monitor licenses", color: "text-blue-400", bg: "bg-blue-500/10" },
            { href: "/coins", icon: Coins, label: "Coin Economy", desc: "Manage virtual currency balances", color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { href: "/gems", icon: Gem, label: "Gem Economy", desc: "Grant and manage gem rewards", color: "text-purple-400", bg: "bg-purple-500/10" },
            { href: "/security", icon: Shield, label: "Security Center", desc: "Monitor threats and policies", color: "text-red-400", bg: "bg-red-500/10" },
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
