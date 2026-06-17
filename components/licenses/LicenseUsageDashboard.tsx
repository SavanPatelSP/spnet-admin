"use client";

import { useState, useEffect } from "react";
import { API_ROUTES } from "@/lib/constants";
import { Gauge, Calendar, Activity, Coins, Gem } from "lucide-react";

interface UsageData {
  deviceCount: number;
  maxDevices: number;
  daysRemaining: number;
  isPremium: boolean;
  premiumPlan?: string;
  coinBalance: number;
  gemBalance: number;
  activationTrend: { label: string; value: number }[];
}

interface Props {
  licenseId: string;
}

export default function LicenseUsageDashboard({ licenseId }: Props) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchUsage() {
      try {
        const response = await fetch(`${API_ROUTES.LICENSES.USAGE}?licenseId=${licenseId}`);
        const result = await response.json();
        if (!cancelled) {
          if (response.ok) setData(result);
          else setError(result.error || "Failed to load usage data");
        }
      } catch {
        if (!cancelled) setError("Failed to load usage data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchUsage();
    return () => { cancelled = true; };
  }, [licenseId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">Loading usage data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-zinc-900 p-5">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const utilization = data.maxDevices > 0 ? Math.round((data.deviceCount / data.maxDevices) * 100) : 0;

  const maxTrend = Math.max(...data.activationTrend.map((d) => d.value), 1);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Gauge size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-zinc-400">Device Utilization</h3>
        </div>
        <div className="relative mb-3 flex items-center justify-center">
          <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={utilization > 80 ? "#ef4444" : utilization > 50 ? "#eab308" : "#22c55e"} strokeWidth="8"
              strokeDasharray={`${(utilization / 100) * 264} 264`} strokeLinecap="round" />
          </svg>
          <span className="absolute text-xl font-bold text-zinc-100">{utilization}%</span>
        </div>
        <p className="text-center text-xs text-zinc-500">{data.deviceCount} / {data.maxDevices} devices</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Calendar size={18} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-zinc-400">Days Remaining</h3>
        </div>
        <p className={`text-3xl font-bold ${data.daysRemaining > 90 ? "text-green-400" : data.daysRemaining > 30 ? "text-yellow-400" : "text-red-400"}`}>
          {data.daysRemaining}
        </p>
        <p className="mt-1 text-xs text-zinc-500">days until expiry</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Activity size={18} className="text-orange-400" />
          <h3 className="text-sm font-semibold text-zinc-400">Premium Status</h3>
        </div>
        {data.isPremium ? (
          <div>
            <span className="inline-block rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-400">Premium</span>
            {data.premiumPlan && <p className="mt-1 text-xs text-zinc-500">{data.premiumPlan} plan</p>}
          </div>
        ) : (
          <span className="text-sm text-zinc-500">Standard license</span>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Coins size={18} className="text-yellow-400" />
          <h3 className="text-sm font-semibold text-zinc-400">Coins Balance</h3>
        </div>
        <p className="text-3xl font-bold text-yellow-400">{data.coinBalance.toLocaleString()}</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Gem size={18} className="text-pink-400" />
          <h3 className="text-sm font-semibold text-zinc-400">Gems Balance</h3>
        </div>
        <p className="text-3xl font-bold text-pink-400">{data.gemBalance.toLocaleString()}</p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Activity size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-zinc-400">Activation Trend</h3>
        </div>
        {data.activationTrend.length > 0 ? (
          <div className="flex items-end gap-1" style={{ height: 48 }}>
            {data.activationTrend.map((d, i) => (
              <div key={d.label || i} className="flex-1 rounded-t transition-all"
                style={{
                  height: `${(d.value / maxTrend) * 100}%`,
                  backgroundColor: d.value > 2 ? "#ef4444" : d.value > 0 ? "#3b82f6" : "#27272a",
                  minHeight: d.value > 0 ? 2 : 0,
                }}
                title={`${d.label}: ${d.value}`} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No recent activity</p>
        )}
      </div>
    </div>
  );
}
