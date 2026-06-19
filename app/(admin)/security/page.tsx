import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Security" };

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { SecurityOverviewCards } from "@/components/security/SecurityOverviewCards";
import { RecentLoginAttempts } from "@/components/security/RecentLoginAttempts";
import { PolicyEditor } from "@/components/security/PolicyEditor";
import { SessionActivityChart } from "@/components/security/SessionActivityChart";
import { SessionActivityTimeline } from "@/components/security/SessionActivityTimeline";
import { RiskScoreChart } from "@/components/security/RiskScoreChart";
import { MfaManagement } from "@/components/security/MfaManagement";
import { Shield, AlertTriangle, LogIn, Ban, Lock, Activity, Users, Fingerprint } from "lucide-react";

export default async function SecurityPage() {
  const [policies, auditLogs, loginHistory, sessions, activations, teamMembers, failedLogins, recentSuccess] =
    await Promise.all([
      prisma.securityPolicy.findMany(),
      prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
      prisma.loginHistory.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { teamMember: { select: { name: true, email: true } } },
      }),
      prisma.session.count(),
      prisma.activation.count(),
      prisma.teamMember.count(),
      prisma.loginHistory.count({ where: { success: false } }),
      prisma.loginHistory.count({ where: { success: true, createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    ]);

  const enabledPolicies = policies.filter((p) => p.enabled).length;
  const highSeverity = policies.filter((p) => p.severity === "High").length;
  const mfaEnabled = await prisma.teamMember.count({ where: { mfaEnabled: true } });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security Dashboard"
        description="Comprehensive security monitoring, threat detection, and platform protection."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Security Policies" value={policies.length} icon={Shield} color="blue" subtitle={`${enabledPolicies} active`} href="/settings/security" />
        <StatCard title="Active Sessions" value={sessions} icon={Users} color="purple" href="/sessions" />
        <StatCard title="Failed Logins (All Time)" value={failedLogins} icon={Ban} color="red" href="/audit-logs?type=login&status=failed" />
        <StatCard title="MFA Enabled" value={mfaEnabled} icon={Lock} color="green" subtitle={`of ${teamMembers} users`} href="/settings/team-members?mfa=true" />
        <StatCard title="High Severity Policies" value={highSeverity} icon={AlertTriangle} color={highSeverity > 0 ? "yellow" : "default"} href="/settings/security?severity=high" />
        <StatCard title="Registered Devices" value={activations} icon={Fingerprint} color="blue" href="/devices" />
        <StatCard title="Logins (24h)" value={recentSuccess} icon={LogIn} color="green" subtitle="successful" href="/audit-logs?type=login" />
        <StatCard title="Recent Events" value={auditLogs.length} icon={Activity} color="purple" subtitle="last 10" href="/audit-logs" />
      </StatCardGrid>

      <SecurityOverviewCards
        policies={policies}
        auditLogs={auditLogs}
        mfaEnabledCount={mfaEnabled}
        totalUsers={teamMembers}
        failedLogins={failedLogins}
        activeSessions={sessions}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SessionActivityChart />
        <RiskScoreChart />
      </div>

      <SessionActivityTimeline />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentLoginAttempts loginHistory={loginHistory} />
        <PolicyEditor policies={policies} />
      </div>

      <MfaManagement />
    </div>
  );
}
