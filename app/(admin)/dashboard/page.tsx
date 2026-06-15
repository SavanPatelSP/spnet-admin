import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import {
  KeyRound,
  Monitor,
  Users,
  CreditCard,
  Activity,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { EXPIRING_SOON_DAYS } from "@/lib/constants";
import { daysUntil } from "@/lib/shared";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [licenses, activations, auditLogs, teamMembers, roles, securityPolicies] = await Promise.all([
    prisma.license.findMany({ include: { activations: true } }),
    prisma.activation.findMany(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.teamMember.findMany(),
    prisma.role.findMany(),
    prisma.securityPolicy.findMany(),
  ]);

  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const suspendedLicenses = licenses.filter((l) => l.status === "SUSPENDED").length;
  const totalDevices = activations.length;
  const totalCapacity = licenses.reduce((t, l) => t + l.maxDevices, 0);
  const utilization = totalCapacity === 0 ? 0 : Math.round((totalDevices / totalCapacity) * 100);
  const expiringSoon = licenses.filter((l) => daysUntil(l.expiresAt) >= 0 && daysUntil(l.expiresAt) <= EXPIRING_SOON_DAYS).length;
  const todayLogs = auditLogs.filter((log) => new Date(log.createdAt).toDateString() === new Date().toDateString()).length;

  const quickActions = [
    { href: "/licenses", icon: KeyRound, label: "Manage Licenses", desc: "Create, edit and monitor licenses", color: "text-blue-400", bg: "bg-blue-500/10" },
    { href: "/settings/team-members", icon: Users, label: "Team Members", desc: "Manage access and roles", color: "text-green-400", bg: "bg-green-500/10" },
    { href: "/security", icon: AlertTriangle, label: "Security Center", desc: "Monitor threats and policies", color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { href: "/reports", icon: ClipboardList, label: "Reports", desc: "View abuse and fraud reports", color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Monitor platform health, security and growth in real time."
      />

      <StatCardGrid columns={6}>
        <StatCard title="Total Licenses" value={licenses.length} icon={KeyRound} color="blue" subtitle={`${activeLicenses} active`} />
        <StatCard title="Active Devices" value={totalDevices} icon={Monitor} color="green" subtitle={`${utilization}% capacity used`} />
        <StatCard title="Team Members" value={teamMembers.length} icon={Users} color="purple" subtitle={`${roles.length} roles`} />
        <StatCard
          title="Suspended"
          value={suspendedLicenses}
          icon={AlertTriangle}
          color={suspendedLicenses > 0 ? "yellow" : "green"}
        />
        <StatCard title="Expiring Soon" value={expiringSoon} icon={Activity} color={expiringSoon > 0 ? "red" : "default"} subtitle={`Within ${EXPIRING_SOON_DAYS} days`} />
        <StatCard title="Today&apos;s Events" value={todayLogs} icon={ClipboardList} color="blue" subtitle={`${auditLogs.length} total logs`} />
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
            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
              {securityPolicies.filter((p) => p.enabled).length}/{securityPolicies.length} Policies Active
            </div>
          </div>
        </Link>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {quickActions.map((action) => {
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

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">Recent Activity</h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">{log.action}</span>
                  <span className="text-sm text-zinc-400">{log.description || log.actorName || "-"}</span>
                </div>
                <span className="text-xs text-zinc-600">
                  {new Date(log.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
