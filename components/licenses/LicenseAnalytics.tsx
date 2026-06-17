"use client";

import { useState, useEffect } from "react";
import { BarChart, MiniStat } from "@/components/ui/Chart";
import { Shield, AlertTriangle, CheckCircle, Activity, Globe, Clock } from "lucide-react";

interface Activation {
  id: string;
  deviceId: string;
  deviceName: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

interface LicenseAnalyticsProps {
  license: {
    id: string;
    status: string;
    maxDevices: number;
    expiresAt: Date;
    createdAt: Date;
  };
  activations: Activation[];
  auditLogs: { action: string; createdAt: Date }[];
}

export function LicenseAnalytics({ license, activations, auditLogs }: LicenseAnalyticsProps) {
  const deviceCount = activations.length;
  const utilization = license.maxDevices > 0 ? Math.round((deviceCount / license.maxDevices) * 100) : 0;
  const uniqueIPs = new Set(activations.map((a) => a.ipAddress).filter(Boolean)).size;
  const uniqueDevices = new Set(activations.map((a) => a.deviceId)).size;

  const [daysSinceCreated, setDaysSinceCreated] = useState(1);
  const [activationRate, setActivationRate] = useState(0);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState(0);
  const [healthScore, setHealthScore] = useState(0);
  const [dailyActivations, setDailyActivations] = useState<number[]>([]);
  const [monthlyActivations, setMonthlyActivations] = useState<number[]>([]);

  useEffect(() => {
    const now = Date.now();
    const newDaysSinceCreated = Math.max(1, Math.floor((now - new Date(license.createdAt).getTime()) / 86400000));
    const newActivationRate = activations.length / newDaysSinceCreated;
    const newDaysUntilExpiry = Math.max(0, Math.floor((new Date(license.expiresAt).getTime() - now) / 86400000));
    const newHealthScore = computeHealthScore(license.status, utilization, newDaysUntilExpiry, newActivationRate);
    const newDailyActivations = getDailyActivationCounts(activations, now);
    const newMonthlyActivations = newDailyActivations.slice(-30);

    const t1 = setTimeout(() => setDaysSinceCreated(newDaysSinceCreated), 0);
    const t2 = setTimeout(() => setActivationRate(newActivationRate), 0);
    const t3 = setTimeout(() => setDaysUntilExpiry(newDaysUntilExpiry), 0);
    const t4 = setTimeout(() => setHealthScore(newHealthScore), 0);
    const t5 = setTimeout(() => setDailyActivations(newDailyActivations), 0);
    const t6 = setTimeout(() => setMonthlyActivations(newMonthlyActivations), 0);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, [license.status, license.createdAt, license.expiresAt, activations, utilization]);

  const suspiciousIPs = detectSuspiciousIPs(activations);
  const rapidActivations = detectRapidActivations(activations);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Shield size={18} className={healthScore >= 80 ? "text-green-400" : healthScore >= 50 ? "text-yellow-400" : "text-red-400"} />
            <h3 className="font-semibold">Health Score</h3>
          </div>
          <p className={`text-3xl font-bold ${healthScore >= 80 ? "text-green-400" : healthScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
            {healthScore}/100
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${healthScore >= 80 ? "bg-green-500" : healthScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        <MiniStat
          label="Device Utilization"
          value={`${utilization}%`}
          trend={utilization > 80 ? "down" : utilization > 50 ? "neutral" : "up"}
          trendLabel={utilization > 80 ? "High usage" : utilization > 50 ? "Moderate" : "Good"}
          sparklineData={dailyActivations.slice(-30)}
        />

        <MiniStat
          label="Activation Rate"
          value={activationRate.toFixed(2)}
          trend={activationRate > 0.5 ? "down" : "up"}
          trendLabel={`${activations.length} total / ${daysSinceCreated}d`}
          color={activationRate > 0.5 ? "#ef4444" : "#22c55e"}
        />

        <MiniStat
          label="Days Remaining"
          value={daysUntilExpiry}
          trend={daysUntilExpiry > 90 ? "up" : daysUntilExpiry > 30 ? "neutral" : "down"}
          trendLabel={daysUntilExpiry > 90 ? "Healthy" : daysUntilExpiry > 30 ? "Expiring" : "Critical"}
          color={daysUntilExpiry > 90 ? "#22c55e" : daysUntilExpiry > 30 ? "#eab308" : "#ef4444"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <h3 className="font-semibold">Activation Timeline (30 days)</h3>
          </div>
          {monthlyActivations.length > 0 ? (
            <BarChart
              data={monthlyActivations.map((count, i) => ({
                label: `Day ${i + 1}`,
                value: count,
                color: count > 2 ? "#ef4444" : count > 0 ? "#3b82f6" : "#27272a",
              }))}
              height={48}
            />
          ) : (
            <p className="text-sm text-zinc-500">No activation activity in the last 30 days.</p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className={suspiciousIPs.length > 0 || rapidActivations > 0 ? "text-red-400" : "text-green-400"} />
            <h3 className="font-semibold">Risk & Abuse Indicators</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-zinc-500" />
                <span className="text-sm text-zinc-300">Unique IPs</span>
              </div>
              <span className={`text-sm font-medium ${uniqueIPs > 5 ? "text-red-400" : "text-zinc-300"}`}>{uniqueIPs}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-zinc-500" />
                <span className="text-sm text-zinc-300">Unique Devices</span>
              </div>
              <span className={`text-sm font-medium ${uniqueDevices > 5 ? "text-yellow-400" : "text-zinc-300"}`}>{uniqueDevices}</span>
            </div>
            {suspiciousIPs.length > 0 && (
              <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-red-400">
                  <AlertTriangle size={14} />
                  Suspicious IP activity detected
                </div>
                <ul className="mt-2 space-y-1">
                  {suspiciousIPs.slice(0, 3).map((ip, i) => (
                    <li key={ip.ip || i} className="font-mono text-xs text-red-300">{ip.ip} — {ip.count} activations</li>
                  ))}
                </ul>
              </div>
            )}
            {rapidActivations > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-zinc-500" />
                  <span className="text-sm text-zinc-300">Rapid re-activations</span>
                </div>
                <span className="text-sm font-medium text-red-400">{rapidActivations} events</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-zinc-500" />
                <span className="text-sm text-zinc-300">Verifications (total)</span>
              </div>
              <span className="text-sm text-zinc-300">{auditLogs.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function computeHealthScore(status: string, utilization: number, daysUntilExpiry: number, activationRate: number): number {
  let score = 100;

  if (status !== "ACTIVE") score -= 40;

  if (utilization > 90) score -= 20;
  else if (utilization > 75) score -= 10;

  if (daysUntilExpiry < 30) score -= 30;
  else if (daysUntilExpiry < 90) score -= 15;

  if (activationRate > 1) score -= 15;
  else if (activationRate > 0.5) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function getDailyActivationCounts(activations: Activation[], now: number): number[] {
  const counts: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(now - i * 86400000);
    const dayEnd = new Date(now - (i - 1) * 86400000);
    counts.push(activations.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= dayStart && d < dayEnd;
    }).length);
  }
  return counts;
}

function detectSuspiciousIPs(activations: Activation[]): { ip: string; count: number }[] {
  const ipCounts = new Map<string, number>();
  for (const a of activations) {
    if (a.ipAddress) {
      ipCounts.set(a.ipAddress, (ipCounts.get(a.ipAddress) || 0) + 1);
    }
  }
  return Array.from(ipCounts.entries())
    .filter(([, count]) => count > 3)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count);
}

function detectRapidActivations(activations: Activation[]): number {
  if (activations.length < 3) return 0;
  const sorted = [...activations].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  let rapid = 0;
  for (let i = 2; i < sorted.length; i++) {
    const diff = new Date(sorted[i].createdAt).getTime() - new Date(sorted[i - 2].createdAt).getTime();
    if (diff < 60000) rapid++;
  }
  return rapid;
}
