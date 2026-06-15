export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { BarChart3, Users, Monitor, Activity } from "lucide-react";
import { calculateUtilization } from "@/lib/shared";

export default async function AnalyticsPage() {
  const [licenses, activations, auditLogs, teamMembers] = await Promise.all([
    prisma.license.findMany({ include: { activations: true } }),
    prisma.activation.findMany(),
    prisma.auditLog.findMany(),
    prisma.teamMember.findMany(),
  ]);

  const totalDevices = activations.length;
  const totalCapacity = licenses.reduce((t, l) => t + l.maxDevices, 0);
  const utilization = calculateUtilization(totalDevices, totalCapacity);
  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const avgDevicesPerLicense = licenses.length > 0 ? (totalDevices / licenses.length).toFixed(1) : "0";

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="Platform-wide analytics and usage insights." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Licenses" value={licenses.length} icon={BarChart3} color="blue" subtitle={`${activeLicenses} active`} />
        <StatCard title="Active Devices" value={totalDevices} icon={Monitor} color="green" subtitle={`Avg ${avgDevicesPerLicense} per license`} />
        <StatCard title="Utilization" value={`${utilization}%`} icon={Activity} color={utilization > 80 ? "yellow" : "default"} subtitle="Device capacity" />
        <StatCard title="Audit Events" value={auditLogs.length} icon={Users} color="purple" subtitle={`${teamMembers.length} team members`} />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">License Plan Distribution</h2>
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
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${(count / licenses.length) * 100}%` }} />
                    </div>
                    <span className="text-sm text-zinc-400">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">License Status Distribution</h2>
          <div className="space-y-3">
            {(["ACTIVE", "SUSPENDED", "PENDING", "EXPIRED", "REVOKED"] as const).map((status) => {
              const count = licenses.filter((l) => l.status === status).length;
              return (
                <div key={status} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                  <span className="text-sm">{status}</span>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-32 overflow-hidden rounded-full bg-zinc-700`}
                    >
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
    </div>
  );
}
