export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Shield, AlertTriangle, CheckCircle, Lock } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export default async function SecurityPage() {
  const [policies, auditLogs] = await Promise.all([
    prisma.securityPolicy.findMany(),
    prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
  ]);

  const enabledCount = policies.filter((p) => p.enabled).length;
  const highSeverity = policies.filter((p) => p.severity === "High").length;
  const recentSecurityEvents = auditLogs.filter((l) =>
    ["EMERGENCY_LOCKDOWN", "POLICY_TOGGLED"].includes(l.action)
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader title="Security Overview" description="Monitor threats, security policies and platform protection." />

      <StatCardGrid columns={4}>
        <StatCard title="Security Policies" value={policies.length} icon={Shield} color="blue" subtitle={`${enabledCount} active`} />
        <StatCard title="Policies Enabled" value={enabledCount} icon={CheckCircle} color="green" subtitle={`${policies.length > 0 ? Math.round((enabledCount / policies.length) * 100) : 0}% coverage`} />
        <StatCard title="High Severity" value={highSeverity} icon={AlertTriangle} color={highSeverity > 0 ? "yellow" : "default"} />
        <StatCard title="Security Events" value={recentSecurityEvents} icon={Lock} color="purple" subtitle="Recent" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Security Policies</h2>
          <div className="space-y-3">
            {policies.map((policy) => (
              <div key={policy.id} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <div>
                  <p className="font-medium">{policy.name}</p>
                  <p className="text-xs text-zinc-500">{policy.category} · {policy.severity}</p>
                </div>
                <StatusBadge status={policy.enabled ? "ENABLED" : "DISABLED"} />
              </div>
            ))}
          </div>
          <Link
            href="/settings/security"
            className="mt-4 inline-block text-sm text-blue-400 transition-colors hover:text-blue-300"
          >
            Manage policies →
          </Link>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Recent Security Activity</h2>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-zinc-500">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-xl bg-zinc-800/50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">{log.action}</span>
                    <span className="text-xs text-zinc-600">{new Date(log.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{log.description || log.actorName || "-"}</p>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/audit-logs"
            className="mt-4 inline-block text-sm text-blue-400 transition-colors hover:text-blue-300"
          >
            View all audit logs →
          </Link>
        </div>
      </div>
    </div>
  );
}
