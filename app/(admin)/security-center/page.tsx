import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Security Center" };

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { getSecurityAlertStats, getSecurityAlerts } from "@/lib/security/alerts";
import { getAggregatedFingerprintStats } from "@/lib/security/fingerprint";
import { formatDateTime } from "@/lib/shared";
import Link from "next/link";
import {
  Shield, AlertTriangle, Activity, Users, Monitor,
  CheckCircle2, XCircle, Clock, Eye, ArrowRight,
  Fingerprint, Lock, Globe,
} from "lucide-react";

const severityColors: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-400 border-green-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default async function SecurityCenterPage() {
  await requireAuth();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    activeSessions,
    failedLogins,
    suspiciousSessions,
    highRiskSessions,
    alertStats,
    fingerprintStats,
    permissionChanges,
    ownershipTransfers,
    recentAlerts,
  ] = await Promise.all([
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.loginHistory.count({ where: { success: false, createdAt: { gte: todayStart } } }),
    prisma.sessionFingerprint.count({ where: { suspicious: true } }),
    prisma.sessionFingerprint.count({ where: { riskScore: { in: ["HIGH", "CRITICAL"] } } }),
    getSecurityAlertStats(),
    getAggregatedFingerprintStats(),
    prisma.auditLog.count({
      where: {
        action: { in: ["ROLE_PERMISSIONS_UPDATED", "TEMP_PERMISSION_GRANTED", "TEMP_PERMISSION_EXPIRED"] },
        createdAt: { gte: todayStart },
      },
    }),
    prisma.auditLog.count({ where: { action: "OWNERSHIP_TRANSFERRED", createdAt: { gte: todayStart } } }),
    getSecurityAlerts({ resolved: false, limit: 10 }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security Center"
        description="Real-time security monitoring, threat detection, and event timeline."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Active Sessions" value={activeSessions} icon={Users} color="blue" />
        <StatCard title="Failed Logins Today" value={failedLogins} icon={XCircle} color={failedLogins > 0 ? "red" : "green"} />
        <StatCard title="Suspicious Sessions" value={suspiciousSessions} icon={AlertTriangle} color={suspiciousSessions > 0 ? "yellow" : "green"} />
        <StatCard title="High Risk Sessions" value={highRiskSessions} icon={Lock} color={highRiskSessions > 0 ? "red" : "green"} />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Security Alerts" actions={
          <Link href="/settings/security" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        }>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Total Alerts</span>
              <span className="text-sm font-medium text-zinc-100">{alertStats.total}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Unresolved</span>
              <span className="text-sm font-medium text-red-400">{alertStats.unresolved}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Critical</span>
              <span className="text-sm font-medium text-red-400">{alertStats.critical}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Today</span>
              <span className="text-sm font-medium text-zinc-100">{alertStats.todayCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Permission Changes</span>
              <span className="text-sm font-medium text-zinc-100">{permissionChanges}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Ownership Transfers</span>
              <span className="text-sm font-medium text-zinc-100">{ownershipTransfers}</span>
            </div>
          </div>
        </Card>

        <Card title="Session Fingerprinting" actions={
          <Link href="/sessions" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View Sessions <ArrowRight size={12} />
          </Link>
        }>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Total Fingerprinted</span>
              <span className="text-sm font-medium text-zinc-100">{fingerprintStats.total}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Suspicious</span>
              <span className="text-sm font-medium text-red-400">{fingerprintStats.suspicious}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Low Risk</span>
              <span className="text-sm font-medium text-green-400">{fingerprintStats.riskDistribution.low}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Medium Risk</span>
              <span className="text-sm font-medium text-yellow-400">{fingerprintStats.riskDistribution.medium}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">High Risk</span>
              <span className="text-sm font-medium text-orange-400">{fingerprintStats.riskDistribution.high}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-sm text-zinc-500">Critical</span>
              <span className="text-sm font-medium text-red-400">{fingerprintStats.riskDistribution.critical}</span>
            </div>
          </div>
        </Card>

        <Card title="Countries" actions={
          <Link href="/sessions" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Details <ArrowRight size={12} />
          </Link>
        }>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {fingerprintStats.countries.slice(0, 8).map((c: any) => (
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
