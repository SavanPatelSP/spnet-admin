"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { CustomTooltip } from "@/components/charts/CustomTooltip";
import { calculateTrend, formatTrend } from "@/lib/analytics";
import { BarChart3, ShieldCheck, Activity, ArrowUpRight } from "lucide-react";

const PLAN_COLORS: Record<string, string> = {
  FREE: "#6b7280", BASIC: "#3b82f6", STUDENT: "#6366f1",
  PLUS: "#a855f7", PRO: "#06b6d4", BUSINESS: "#f97316",
  ENTERPRISE: "#ef4444", EXTREME: "#ec4899", SP_PLAN: "#eab308",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#22c55e", SUSPENDED: "#eab308", PENDING: "#3b82f6",
  EXPIRED: "#ef4444", REVOKED: "#71717a",
};

interface Props {
  planDistribution: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  previousPlanDistribution?: { name: string; value: number }[];
  previousStatusDistribution?: { name: string; value: number }[];
}

export function AnalyticsCharts({
  planDistribution,
  statusDistribution,
  previousPlanDistribution,
  previousStatusDistribution,
}: Props) {
  const [planShowAll, setPlanShowAll] = useState(false);
  const displayPlanData = useMemo(
    () => planShowAll ? planDistribution : planDistribution.slice(0, 5),
    [planDistribution, planShowAll]
  );
  const totalPlans = planDistribution.reduce((s, d) => s + d.value, 0);
  const activeLicenses = statusDistribution.find((s) => s.name === "ACTIVE")?.value || 0;
  const totalStatus = statusDistribution.reduce((s, d) => s + d.value, 0);
  const hasNoPlanData = planDistribution.every((d) => d.value === 0);
  const hasNoStatusData = statusDistribution.every((d) => d.value === 0);

  const planTrend = previousPlanDistribution
    ? calculateTrend(totalPlans, previousPlanDistribution.reduce((s, d) => s + d.value, 0))
    : undefined;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/settings/licensing"
          className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
                <BarChart3 size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Total Licenses</p>
                <p className="text-2xl font-bold text-zinc-100">{totalPlans}</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-zinc-600 transition-colors group-hover:text-zinc-400" />
          </div>
          {planTrend && (
            <p className={`mt-2 text-xs ${planTrend.direction === 'up' ? 'text-green-400' : planTrend.direction === 'down' ? 'text-red-400' : 'text-zinc-500'}`}>
              {formatTrend(planTrend)}
            </p>
          )}
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
                <p className="text-sm text-zinc-500">Active Licenses</p>
                <p className="text-2xl font-bold text-zinc-100">{activeLicenses}</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-zinc-600 transition-colors group-hover:text-zinc-400" />
          </div>
          {previousStatusDistribution && (() => {
            const prevActive = previousStatusDistribution.find((s) => s.name === "ACTIVE")?.value || 0;
            const trend = calculateTrend(activeLicenses, prevActive);
            return (
              <p className={`mt-2 text-xs ${trend.direction === 'up' ? 'text-green-400' : trend.direction === 'down' ? 'text-red-400' : 'text-zinc-500'}`}>
                {formatTrend(trend)}
              </p>
            );
          })()}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard
          title="License Plan Distribution"
          subtitle={`${totalPlans} total`}
          icon={<BarChart3 size={16} className="text-blue-400" />}
          action={planDistribution.length > 5 ? (
            <button
              onClick={() => setPlanShowAll(!planShowAll)}
              className="rounded-lg px-2.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 sm:text-xs"
            >
              {planShowAll ? "Top 5" : `All (${planDistribution.length})`}
            </button>
          ) : undefined}
        >
          {hasNoPlanData ? (
            <div className="flex h-48 flex-col items-center justify-center text-zinc-600">
              <Activity size={24} className="mb-2" />
              <p className="text-sm">No Data Available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(displayPlanData.length * 44, 120)}>
              <BarChart data={displayPlanData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
                <Tooltip content={<CustomTooltip total={totalPlans} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {displayPlanData.map((entry) => (
                    <Cell key={entry.name} fill={PLAN_COLORS[entry.name] || "#71717a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {!hasNoPlanData && (
            <div className="mt-3 flex flex-wrap gap-2">
              {planDistribution.map((entry) => {
                const pct = totalPlans > 0 ? ((entry.value / totalPlans) * 100).toFixed(1) : "0.0";
                return (
                  <span key={entry.name} className="inline-flex items-center gap-1 text-[10px] text-zinc-400 sm:text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[entry.name] || "#71717a" }} />
                    {entry.name}: {pct}%
                  </span>
                );
              })}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="License Status Distribution"
          subtitle={`${totalStatus} total`}
          icon={<Activity size={16} className="text-purple-400" />}
        >
          {hasNoStatusData ? (
            <div className="flex h-48 flex-col items-center justify-center text-zinc-600">
              <Activity size={24} className="mb-2" />
              <p className="text-sm">No Data Available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDistribution.filter((d) => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                  {statusDistribution.filter((d) => d.value > 0).map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#71717a"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={totalStatus} />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {!hasNoStatusData && (
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {statusDistribution.filter((d) => d.value > 0).map((entry) => {
                const pct = totalStatus > 0 ? ((entry.value / totalStatus) * 100).toFixed(1) : "0.0";
                return (
                  <span key={entry.name} className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] || "#71717a" }} />
                    {entry.name}
                    <span className="font-medium text-zinc-300">{pct}%</span>
                  </span>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
