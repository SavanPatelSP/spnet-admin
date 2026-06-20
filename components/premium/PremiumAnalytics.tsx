"use client";

import { Crown, Layers, Infinity } from "lucide-react";
import { PREMIUM_PLANS } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
} from "recharts";

interface PremiumAnalyticsProps {
  planBreakdown: Record<string, number>;
  subscriptionTypeBreakdown: Record<string, number>;
  totalPremium: number;
  premiumLicenses: { plan: string }[];
}

const PLAN_COLORS: Record<string, string> = {
  PLUS: "#3b82f6",
  PRO: "#a855f7",
  BUSINESS: "#f59e0b",
  ENTERPRISE: "#ef4444",
  STUDENT: "#22c55e",
  SP_PLAN: "#06b6d4",
};

const TYPE_COLORS: Record<string, string> = {
  MONTHLY: "#3b82f6",
  YEARLY: "#22c55e",
  LIFETIME: "#a855f7",
  CUSTOM: "#06b6d4",
};

export function PremiumAnalytics({
  planBreakdown,
  subscriptionTypeBreakdown,
  totalPremium,
}: PremiumAnalyticsProps) {
  const planOrder = PREMIUM_PLANS.filter((p) => planBreakdown[p]);
  const planData = planOrder.map((plan) => ({
    name: plan,
    value: planBreakdown[plan] || 0,
  }));

  const typeData = Object.entries(subscriptionTypeBreakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const lifetimeCount = subscriptionTypeBreakdown.LIFETIME || 0;
  const nonLifetime = totalPremium - lifetimeCount;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Layers size={16} className="text-yellow-400" />
          <h3 className="font-semibold text-zinc-100">Plan Distribution</h3>
        </div>
        {planData.length === 0 ? (
          <p className="text-sm text-zinc-500">No premium plans active</p>
        ) : (
          <div className="space-y-3">
            <ResponsiveContainer width="100%" height={planData.length * 40 + 20}>
              <BarChart data={planData} layout="vertical" margin={{ left: 70, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#d4d4d8" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {planData.map((entry) => (
                    <Cell key={entry.name} fill={PLAN_COLORS[entry.name] || "#71717a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2">
              {planData.map((entry) => (
                <span key={entry.name} className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[entry.name] || "#71717a" }} />
                  {entry.name}: {entry.value} ({totalPremium > 0 ? Math.round((entry.value / totalPremium) * 100) : 0}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Layers size={16} className="text-blue-400" />
          <h3 className="font-semibold text-zinc-100">Subscription Type Distribution</h3>
        </div>
        {typeData.length === 0 ? (
          <p className="text-sm text-zinc-500">No subscription data</p>
        ) : (
          <div className="space-y-3">
            <ResponsiveContainer width="100%" height={typeData.length * 40 + 20}>
              <BarChart data={typeData} layout="vertical" margin={{ left: 70, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#d4d4d8" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {typeData.map((entry) => (
                    <Cell key={entry.name} fill={TYPE_COLORS[entry.name] || "#71717a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2">
              {typeData.map((entry) => (
                <span key={entry.name} className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[entry.name] || "#71717a" }} />
                  {entry.name}: {entry.value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-5 flex items-center gap-2">
          <Infinity size={16} className="text-purple-400" />
          <h3 className="font-semibold text-zinc-100">Lifetime Breakdown</h3>
        </div>
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400">{lifetimeCount}</p>
            <p className="mt-1 text-xs text-zinc-500">Lifetime</p>
          </div>
          <div className="h-12 w-px bg-zinc-800" />
          <div className="text-center">
            <p className="text-3xl font-bold text-zinc-100">{nonLifetime}</p>
            <p className="mt-1 text-xs text-zinc-500">Term-based</p>
          </div>
        </div>
        {totalPremium > 0 && (
          <ResponsiveContainer width="100%" height={32}>
            <RePieChart>
              <Pie data={[
                { name: "Lifetime", value: lifetimeCount },
                { name: "Term-based", value: nonLifetime },
              ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={14} innerRadius={0}>
                <Cell fill="#a855f7" />
                <Cell fill="#27272a" />
              </Pie>
            </RePieChart>
          </ResponsiveContainer>
        )}
        <p className="mt-3 text-center text-xs text-zinc-600">
          {lifetimeCount} of {totalPremium} premium licenses are lifetime (
          {totalPremium > 0 ? Math.round((lifetimeCount / totalPremium) * 100) : 0}%)
        </p>
      </div>
    </div>
  );
}
