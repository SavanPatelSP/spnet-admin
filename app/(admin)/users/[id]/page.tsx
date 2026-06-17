import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserDetailActions } from "@/components/users/UserDetailActions";
import { UserAuditTrail } from "@/components/users/UserAuditTrail";
import { UserSessionsPanel } from "@/components/users/UserSessionsPanel";
import { UserLoginHistory } from "@/components/users/UserLoginHistory";
import { UserMfaSetup } from "@/components/users/UserMfaSetup";
import { UserPasswordPolicy } from "@/components/users/UserPasswordPolicy";
import { UserLifecycleTimeline } from "@/components/users/UserLifecycleTimeline";
import { formatDateTime } from "@/lib/shared";
import { User, Shield, Calendar, Clock, AlertTriangle, KeyRound, ShieldCheck, Activity, Ban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const member = await prisma.teamMember.findUnique({
    where: { id },
    include: {
      role: { include: { permissions: true } },
      license: true,
    },
  });

  if (!member) notFound();

  const memberEmail = member.email;
  const [auditLogs, sessions, loginHistory, failedToday] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        OR: [
          { actorEmail: memberEmail },
          { description: { contains: memberEmail } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.session.findMany({
      where: { teamMemberId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loginHistory.findMany({
      where: { teamMemberId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.loginHistory.count({
      where: {
        teamMemberId: id,
        success: false,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  const isLocked = member.lockedUntil && member.lockedUntil > new Date();
  const activeSessions = sessions.filter((s) => s.expiresAt > new Date()).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title={member.name}
        description={member.email}
        actions={<UserDetailActions member={member} />}
      />

      <StatCardGrid columns={4}>
        <StatCard title="Status" value={member.status} icon={User} color={member.status === "ACTIVE" ? "green" : "yellow"} />
        <StatCard title="Role" value={member.role.name} icon={Shield} color="purple" subtitle={`${member.role.permissions.length} permissions`} />
        <StatCard title="Last Login" value={member.lastLogin ? formatDateTime(member.lastLogin) : "Never"} icon={Clock} color="blue" />
        <StatCard title="Joined" value={formatDateTime(member.createdAt)} icon={Calendar} color="default" />
      </StatCardGrid>

      <StatCardGrid columns={4}>
        <StatCard
          title="MFA Status"
          value={member.mfaEnabled ? "Enabled" : "Disabled"}
          icon={ShieldCheck}
          color={member.mfaEnabled ? "green" : "default"}
        />
        <StatCard title="Active Sessions" value={activeSessions} icon={Activity} color="green" subtitle={`${sessions.length} total`} />
        <StatCard
          title="Failed Attempts Today"
          value={failedToday}
          icon={Ban}
          color={failedToday > 0 ? "yellow" : "default"}
        />
        <StatCard
          title="Account Locked"
          value={isLocked ? "Yes" : "No"}
          icon={AlertTriangle}
          color={isLocked ? "red" : "default"}
        />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Full Name</p>
              <p className="mt-0.5">{member.name}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Email Address</p>
              <p className="mt-0.5">{member.email}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Status</p>
              <p className="mt-0.5"><StatusBadge status={member.status} /></p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Last Login</p>
              <p className="mt-0.5 text-sm">{member.lastLogin ? formatDateTime(member.lastLogin) : "Never logged in"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Account Created</p>
              <p className="mt-0.5 text-sm">{formatDateTime(member.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Last Updated</p>
              <p className="mt-0.5 text-sm">{formatDateTime(member.updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Security & Access</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Role</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm font-medium">
                  {member.role.name}
                </span>
                <StatusBadge status={member.role.riskLevel === "Critical" || member.role.riskLevel === "High" ? "SUSPENDED" : "ACTIVE"} />
              </div>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Failed Login Attempts</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`text-lg font-bold ${member.failedLoginAttempts >= 5 ? "text-red-400" : member.failedLoginAttempts > 0 ? "text-yellow-400" : "text-green-400"}`}>
                  {member.failedLoginAttempts}
                </span>
                {isLocked && (
                  <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                    <AlertTriangle size={12} /> Locked until {formatDateTime(member.lockedUntil!)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-zinc-500">License Association</p>
              {member.license ? (
                <div className="mt-1">
                  <a href={`/licenses/${member.license.id}`} className="font-mono text-sm text-blue-400 hover:underline">
                    {member.license.key}
                  </a>
                  <p className="text-xs text-zinc-500 mt-0.5">{member.license.organization} &middot; {member.license.plan}</p>
                </div>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">No license assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Multi-Factor Authentication</h2>
          <UserMfaSetup teamMemberId={member.id} mfaEnabled={member.mfaEnabled} />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Active Sessions</h2>
          <UserSessionsPanel teamMemberId={member.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Login History</h2>
          <UserLoginHistory teamMemberId={member.id} initialLogs={loginHistory} />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Lifecycle Timeline</h2>
          <UserLifecycleTimeline teamMemberId={member.id} />
        </div>
      </div>

      <UserPasswordPolicy />

      <UserAuditTrail logs={auditLogs} />
    </div>
  );
}
