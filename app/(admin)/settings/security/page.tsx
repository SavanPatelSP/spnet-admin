import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Security Center" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getSecurityAlertStats, getSecurityAlerts, resolveSecurityAlert } from "@/lib/security/alerts";
import { getAggregatedFingerprintStats } from "@/lib/security/fingerprint";
import { formatDateTime } from "@/lib/shared";
import { Shield, AlertTriangle, CheckCircle, Lock, Fingerprint, Globe, Activity, Users, XCircle } from "lucide-react";
import PolicyActions from "@/components/settings/security/PolicyActions";
import SecurityAlertsList from "@/components/security/SecurityAlertsList";

const severityColors: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-400 border-green-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default async function SecuritySettingsPage() {
  await requirePermission("View Security Policies");
  const [
    policies,
    alertStats,
    fingerprintStats,
    recentAlerts,
    activeSessions,
    failedLogins,
  ] = await Promise.all([
    prisma.securityPolicy.findMany({ orderBy: { createdAt: "asc" } }),
    getSecurityAlertStats(),
    getAggregatedFingerprintStats(),
    getSecurityAlerts({ limit: 5 }),
    prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.loginHistory.count({
      where: {
        success: false,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  const enabledCount = policies.filter((p) => p.enabled).length;
  const categories = [...new Set(policies.map((p) => p.category))];
  const severityMap: Record<string, number> = {};
  for (const p of policies) {
    severityMap[p.severity] = (severityMap[p.severity] || 0) + 1;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Security Center" description="MFA, IP allowlists, lockdown controls and security posture." />

      <StatCardGrid columns={6}>
        <StatCard title="Total Policies" value={policies.length} icon={Shield} color="blue" subtitle={`${enabledCount} enabled`} />
        <StatCard title="Enabled" value={enabledCount} icon={CheckCircle} color="green" subtitle={`${policies.length > 0 ? Math.round((enabledCount / policies.length) * 100) : 0}% coverage`} />
        <StatCard title="Active Sessions" value={activeSessions} icon={Users} color="blue" />
        <StatCard title="Failed Logins" value={failedLogins} icon={XCircle} color={failedLogins > 0 ? "red" : "green"} subtitle="Today" />
        <StatCard title="Security Alerts" value={alertStats.unresolved} icon={AlertTriangle} color={alertStats.unresolved > 0 ? "yellow" : "green"} subtitle="Unresolved" />
        <StatCard title="Suspicious Sessions" value={fingerprintStats.suspicious} icon={Fingerprint} color={fingerprintStats.suspicious > 0 ? "red" : "green"} />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Security Alerts" description="Recent security events requiring attention">
          <SecurityAlertsList alerts={recentAlerts.alerts} />
        </Card>

        <Card title="Session Fingerprinting" description="Risk distribution across all sessions">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-zinc-800/30">
              <p className="text-2xl font-bold text-green-400">{fingerprintStats.riskDistribution.low}</p>
              <p className="text-xs text-zinc-500 mt-1">Low Risk</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-zinc-800/30">
              <p className="text-2xl font-bold text-yellow-400">{fingerprintStats.riskDistribution.medium}</p>
              <p className="text-xs text-zinc-500 mt-1">Medium Risk</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-zinc-800/30">
              <p className="text-2xl font-bold text-orange-400">{fingerprintStats.riskDistribution.high}</p>
              <p className="text-xs text-zinc-500 mt-1">High Risk</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-zinc-800/30">
              <p className="text-2xl font-bold text-red-400">{fingerprintStats.riskDistribution.critical}</p>
              <p className="text-xs text-zinc-500 mt-1">Critical Risk</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {fingerprintStats.countries.slice(0, 5).map((c: any) => (
              <div key={c.country} className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-zinc-500">
                  <Globe size={12} />
                  {c.country || "Unknown"}
                </span>
                <span className="text-sm font-medium text-zinc-100">{c._count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">Security Policies</h2>
        <div className="space-y-3">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="flex flex-col gap-4 rounded-xl bg-zinc-800/50 px-5 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{policy.name}</h3>
                  <StatusBadge status={policy.enabled ? "ENABLED" : "DISABLED"} />
                </div>
                <p className="mt-1 text-sm text-zinc-500">{policy.description || "No description"}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                  <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5">{policy.category}</span>
                  <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5">{policy.severity}</span>
                  {policy.systemManaged && <span className="text-blue-400">System Managed</span>}
                </div>
              </div>
              <PolicyActions id={policy.id} enabled={policy.enabled} name={policy.name} />
            </div>
          ))}
        </div>
      </div>

      <Card title="Security Events Timeline">
        <div className="space-y-2">
          {recentAlerts.alerts.length === 0 ? (
            <div className="text-sm text-zinc-500 py-4 text-center">No security alerts yet.</div>
          ) : (
            recentAlerts.alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between rounded-xl bg-zinc-800/30 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${severityColors[alert.severity] || severityColors.MEDIUM}`}>
                    {alert.severity}
                  </span>
                  <span className="text-sm text-zinc-200 truncate">{alert.title}</span>
                </div>
                <span className="shrink-0 text-xs text-zinc-600">{formatDateTime(alert.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
