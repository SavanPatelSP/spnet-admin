"use client";

import { useMemo } from "react";
import { PieChart, TrendingUp } from "lucide-react";

interface BalanceEntry {
  organization: string;
  balance: number;
}

export function GemDistributionChart({ balances }: { balances: BalanceEntry[] }) {
  const stats = useMemo(() => {
    const total = balances.reduce((s, b) => s + b.balance, 0);
    const nonZero = balances.filter((b) => b.balance > 0);
    const zeroCount = balances.length - nonZero.length;

    if (total === 0) {
      return { total: 0, nonZero: 0, zeroCount, topPercent: 0, topSum: 0, topCount: 0, avg: 0, median: 0 };
    }

    const sorted = [...nonZero].sort((a, b) => b.balance - a.balance);
    const topCount = Math.max(1, Math.ceil(sorted.length * 0.2));
    const topSum = sorted.slice(0, topCount).reduce((s, b) => s + b.balance, 0);
    const topPercent = Math.round((topSum / total) * 100);
    const values = sorted.map((b) => b.balance);
    const avg = Math.round(total / balances.length);
    const mid = Math.floor(values.length / 2);
    const median = values.length % 2 === 0
      ? Math.round((values[mid - 1] + values[mid]) / 2)
      : values[mid];

    return { total, nonZero: nonZero.length, zeroCount, topPercent, topSum, topCount, avg, median };
  }, [balances]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <PieChart size={16} className="text-purple-400" />
        Distribution
      </h3>

      {stats.total === 0 ? (
        <p className="text-sm text-zinc-500">No gem data available.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Total Supply</p>
            <p className="mt-1 text-lg font-bold text-purple-400">{stats.total.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Active Holders</p>
            <p className="mt-1 text-lg font-bold text-blue-400">{stats.nonZero}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <p className="flex items-center gap-1 text-xs text-zinc-500">
              <TrendingUp size={12} />
              Top 20% Concentration
            </p>
            <p className={`mt-1 text-lg font-bold ${stats.topPercent > 80 ? "text-red-400" : stats.topPercent > 50 ? "text-yellow-400" : "text-green-400"}`}>
              {stats.topPercent}%
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3">
            <p className="text-xs text-zinc-500">Avg / Median</p>
            <p className="mt-1 text-lg font-bold text-zinc-300">
              {stats.avg.toLocaleString()} / {stats.median.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
