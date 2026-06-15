export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KeyRound, Monitor, Activity, AlertTriangle } from "lucide-react";
import { EXPIRING_SOON_DAYS, AUDIT_RETENTION_DAYS, DEFAULT_MAX_DEVICES } from "@/lib/constants";
import { daysUntil, calculateUtilization } from "@/lib/shared";

export default async function LicensingSettingsPage() {
  const licenses = await prisma.license.findMany({ include: { activations: true } });
  const totalDevices = licenses.reduce((t, l) => t + l.activations.length, 0);
  const totalCapacity = licenses.reduce((t, l) => t + l.maxDevices, 0);
  const utilization = calculateUtilization(totalDevices, totalCapacity);
  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const expiringSoon = licenses.filter((l) => {
    const d = daysUntil(l.expiresAt);
    return d >= 0 && d <= EXPIRING_SOON_DAYS;
  }).length;

  return (
    <div className="space-y-8">
      <PageHeader title="Licensing Defaults" description="Templates, grace periods, limits and activation policies." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Licenses" value={licenses.length} icon={KeyRound} color="blue" subtitle="All time" />
        <StatCard title="Active Licenses" value={activeLicenses} icon={Activity} color="green" subtitle={`${licenses.length > 0 ? Math.round((activeLicenses / licenses.length) * 100) : 0}% active rate`} />
        <StatCard title="Device Utilization" value={`${utilization}%`} icon={Monitor} color={utilization > 80 ? "yellow" : "green"} subtitle={`${totalDevices}/${totalCapacity} devices`} />
        <StatCard title="Expiring Soon" value={expiringSoon} icon={AlertTriangle} color={expiringSoon > 0 ? "yellow" : "default"} subtitle={`Within ${EXPIRING_SOON_DAYS} days`} />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Default Configuration</h2>
          <div className="space-y-4">
            <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">Default Max Devices</span>
              <span className="font-medium">{DEFAULT_MAX_DEVICES}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">Audit Log Retention</span>
              <span className="font-medium">{AUDIT_RETENTION_DAYS} days</span>
            </div>
            <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">Expiring Soon Threshold</span>
              <span className="font-medium">{EXPIRING_SOON_DAYS} days</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Plan Distribution</h2>
          <div className="space-y-3">
            {Object.entries(
              licenses.reduce<Record<string, number>>((acc, l) => {
                acc[l.plan] = (acc[l.plan] || 0) + 1;
                return acc;
              }, {})
            )
              .sort(([, a], [, b]) => b - a)
              .map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                  <span className="text-sm font-medium">{plan}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-700">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(count / licenses.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-zinc-400">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">License Status Overview</h2>
        <div className="space-y-3">
          {(["ACTIVE", "SUSPENDED", "PENDING", "EXPIRED", "REVOKED"] as const).map((status) => {
            const count = licenses.filter((l) => l.status === status).length;
            return (
              <div key={status} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <StatusBadge status={status} />
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-700">
                    <div
                      className={`h-full rounded-full ${
                        status === "ACTIVE" ? "bg-green-500" :
                        status === "SUSPENDED" ? "bg-yellow-500" :
                        status === "EXPIRED" ? "bg-red-500" :
                        "bg-zinc-500"
                      }`}
                      style={{ width: `${licenses.length > 0 ? (count / licenses.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-zinc-400">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
