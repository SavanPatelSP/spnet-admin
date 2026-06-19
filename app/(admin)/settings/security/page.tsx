import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Security Center" };

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Shield, AlertTriangle, CheckCircle, Lock } from "lucide-react";
import PolicyActions from "@/components/settings/security/PolicyActions";

export default async function SecuritySettingsPage() {
  const policies = await prisma.securityPolicy.findMany({ orderBy: { createdAt: "asc" } });

  const enabledCount = policies.filter((p) => p.enabled).length;
  const categories = [...new Set(policies.map((p) => p.category))];
  const severityMap: Record<string, number> = {};
  for (const p of policies) {
    severityMap[p.severity] = (severityMap[p.severity] || 0) + 1;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Security Center" description="MFA, IP allowlists, lockdown controls and security posture." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Policies" value={policies.length} icon={Shield} color="blue" subtitle={`${enabledCount} enabled`} />
        <StatCard title="Enabled" value={enabledCount} icon={CheckCircle} color="green" subtitle={`${policies.length > 0 ? Math.round((enabledCount / policies.length) * 100) : 0}% coverage`} />
        <StatCard title="Categories" value={categories.length} icon={Lock} color="purple" />
        <StatCard title="High Severity" value={severityMap["High"] || 0} icon={AlertTriangle} color={(severityMap["High"] || 0) > 0 ? "yellow" : "default"} />
      </StatCardGrid>

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
    </div>
  );
}
