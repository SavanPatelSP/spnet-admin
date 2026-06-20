import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Analytics" };

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { BarChart3, Monitor, Activity, Users, ArrowUpRight, ShieldCheck } from "lucide-react";
import { calculateUtilization } from "@/lib/shared";
import { AnalyticsCharts } from "./AnalyticsCharts";
import Link from "next/link";
import { calculateTrend } from "@/lib/analytics";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const rangeMap: Record<string, number> = {
    "24h": 1, "7d": 7, "30d": 30, "90d": 90,
  };
  const days = rangeMap[rangeParam || ""] || 30;
  const rangeLabel = rangeParam || "30d";

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);
  const previousPeriodStart = new Date();
  previousPeriodStart.setDate(previousPeriodStart.getDate() - days * 2);

  const [licenses, activations, auditLogs, teamMembers, previousActivations] = await Promise.all([
    prisma.license.findMany({
      include: { activations: true },
      where: days < 90 ? { createdAt: { gte: periodStart } } : undefined,
    }),
    prisma.activation.findMany({
      where: days < 90 ? { createdAt: { gte: periodStart } } : undefined,
    }),
    prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      where: days < 90 ? { createdAt: { gte: periodStart } } : undefined,
    }),
    prisma.teamMember.findMany(),
    days > 1
      ? prisma.activation.count({
          where: {
            createdAt: { gte: previousPeriodStart, lt: periodStart },
          },
        })
      : Promise.resolve(0),
  ]);

  const totalDevices = activations.length;
  const totalCapacity = licenses.reduce((t: number, l: any) => t + l.maxDevices, 0);
  const utilization = calculateUtilization(totalDevices, totalCapacity);
  const activeLicenses = licenses.filter((l: any) => l.status === "ACTIVE").length;
  const avgDevicesPerLicense = licenses.length > 0 ? (totalDevices / licenses.length).toFixed(1) : "0";

  const planDistribution = Object.entries(
    licenses.reduce((acc: Record<string, number>, l: any) => {
      acc[l.plan] = (acc[l.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort(([, a], [, b]) => (b as number) - (a as number)).map(([name, value]) => ({ name, value: value as number }));

  const statusDistribution = (["ACTIVE", "SUSPENDED", "PENDING", "EXPIRED", "REVOKED"] as const).map((status) => ({
    name: status,
    value: licenses.filter((l: any) => l.status === status).length,
  }));

  const deviceTrend = calculateTrend(totalDevices, previousActivations);
  const totalEmpty = totalDevices === 0 && licenses.length === 0 && auditLogs.length === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Platform-wide analytics and usage insights."
        actions={
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            {["24h", "7d", "30d", "90d"].map((r) => (
              <Link
                key={r}
                href={`/analytics?range=${r}`}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  rangeLabel === r
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {r}
              </Link>
            ))}
            <Link
              href="/analytics?range=all"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                rangeLabel === "all" || rangeLabel === "30d"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              All
            </Link>
          </div>
        }
      />

      {totalEmpty ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <Activity size={40} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-lg text-zinc-400">Awaiting Activity</p>
          <p className="mt-1 text-sm text-zinc-600">Analytics will populate once data is available.</p>
        </div>
      ) : (
        <>
          <StatCardGrid columns={4}>
            <StatCard
              title="Total Licenses"
              value={licenses.length}
              icon={BarChart3}
              color="blue"
              subtitle={`${activeLicenses} active`}
              href="/settings/licensing"
            />
            <StatCard
              title="Active Devices"
              value={totalDevices}
              icon={Monitor}
              color="green"
              subtitle={`Avg ${avgDevicesPerLicense} per license`}
              trend={{
                value: deviceTrend.percentage + "%",
                direction: deviceTrend.direction === "up" ? "up" : deviceTrend.direction === "down" ? "down" : "neutral",
                label: "vs prev period",
              }}
              href="/devices"
            />
            <StatCard
              title="Utilization"
              value={`${utilization}%`}
              icon={Activity}
              color={utilization > 80 ? "yellow" : "default"}
              subtitle="Device capacity"
              href="/settings/licensing"
            />
            <StatCard
              title="Audit Events"
              value={auditLogs.length}
              icon={Users}
              color="purple"
              subtitle={`${teamMembers.length} team members`}
              href="/audit-logs"
            />
          </StatCardGrid>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/devices"
              className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
                    <Monitor size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Devices</p>
                    <p className="text-2xl font-bold text-zinc-100">{totalDevices}</p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-zinc-600 transition-colors group-hover:text-zinc-400" />
              </div>
            </Link>
            <Link
              href="/settings/licensing"
              className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10">
                    <ShieldCheck size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Licenses</p>
                    <p className="text-2xl font-bold text-zinc-100">{licenses.length}</p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-zinc-600 transition-colors group-hover:text-zinc-400" />
              </div>
            </Link>
            <Link
              href="/audit-logs"
              className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10">
                    <Activity size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Audit Events</p>
                    <p className="text-2xl font-bold text-zinc-100">{auditLogs.length}</p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-zinc-600 transition-colors group-hover:text-zinc-400" />
              </div>
            </Link>
            <Link
              href="/settings/team-members"
              className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-500/10">
                    <Users size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Team Members</p>
                    <p className="text-2xl font-bold text-zinc-100">{teamMembers.length}</p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-zinc-600 transition-colors group-hover:text-zinc-400" />
              </div>
            </Link>
          </div>

          <AnalyticsCharts
            planDistribution={planDistribution}
            statusDistribution={statusDistribution}
          />
        </>
      )}
    </div>
  );
}
