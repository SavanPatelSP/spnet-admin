export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { UsersTable } from "@/components/users/UsersTable";
import BulkInviteButton from "@/components/users/BulkInviteButton";
import { Users, UserPlus, Shield, AlertTriangle, ShieldCheck, Activity, Building, Calendar } from "lucide-react";
import { formatDate } from "@/lib/shared";

export default async function UsersPage() {
  const [teamMembers, roles, sessions, loginHistory] = await Promise.all([
    prisma.teamMember.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.session.findMany({ where: { expiresAt: { gt: new Date() } } }),
    prisma.loginHistory.count(),
  ]);

  const activeMembers = teamMembers.filter((m) => m.status === "ACTIVE").length;
  const suspendedMembers = teamMembers.filter((m) => m.status === "SUSPENDED").length;
  const lockedMembers = teamMembers.filter((m) => m.lockedUntil && m.lockedUntil > new Date()).length;
  const mfaEnabled = teamMembers.filter((m) => m.mfaEnabled).length;
  const activeSessions = sessions.length;

  const departmentCounts = teamMembers.reduce<Record<string, number>>((acc, m) => {
    if (m.department) {
      acc[m.department] = (acc[m.department] || 0) + 1;
    }
    return acc;
  }, {});
  const departmentDistribution = Object.entries(departmentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([dept, count]) => `${dept} (${count})`)
    .join(", ");

  const users = teamMembers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role.name,
    status: m.status,
    lastLogin: m.lastLogin ? formatDate(m.lastLogin) : null,
    createdAt: formatDate(m.createdAt),
  }));

  const roleNames = roles.map((r) => r.name);

  const passwordPolicySummary = {
    total: teamMembers.length,
    neverChanged: teamMembers.filter((m) => !m.passwordChangedAt).length,
    mfaEnabled,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        description="Manage team members, roles and access across your organization."
        actions={
          <BulkInviteButton roles={roles} />
        }
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Members" value={teamMembers.length} icon={Users} color="blue" />
        <StatCard title="Active" value={activeMembers} icon={UserPlus} color="green" subtitle={`${teamMembers.length > 0 ? Math.round((activeMembers / teamMembers.length) * 100) : 0}% of total`} />
        <StatCard title="Suspended" value={suspendedMembers} icon={AlertTriangle} color={suspendedMembers > 0 ? "yellow" : "default"} />
        <StatCard title="Roles" value={roles.length} icon={Shield} color="purple" subtitle={`${lockedMembers} locked`} />
      </StatCardGrid>

      <StatCardGrid columns={4}>
        <StatCard title="MFA Enabled" value={mfaEnabled} icon={ShieldCheck} color="blue" subtitle={`${teamMembers.length > 0 ? Math.round((mfaEnabled / teamMembers.length) * 100) : 0}% of members`} />
        <StatCard title="Active Sessions" value={activeSessions} icon={Activity} color="green" subtitle="Currently active" />
        <StatCard title="Department Distribution" value={Object.keys(departmentCounts).length} icon={Building} color="purple" subtitle={departmentDistribution || "No departments"} />
        <StatCard title="Login History" value={loginHistory} icon={Calendar} color="default" subtitle="Total recorded" />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">Password Policy Summary</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-500">Total Members</p>
            <p className="mt-1 text-2xl font-bold">{passwordPolicySummary.total}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-500">Never Changed Password</p>
            <p className="mt-1 text-2xl font-bold text-yellow-400">{passwordPolicySummary.neverChanged}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 p-4">
            <p className="text-sm text-zinc-500">MFA Enabled</p>
            <p className="mt-1 text-2xl font-bold text-blue-400">{passwordPolicySummary.mfaEnabled}</p>
          </div>
        </div>
      </div>

      <UsersTable users={users} roles={roleNames} />
    </div>
  );
}
