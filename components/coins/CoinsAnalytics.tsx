"use client";

import { useMemo } from "react";
import { MiniStat, BarChart } from "@/components/ui/Chart";
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Clock } from "lucide-react";

const NOW = Date.now();

interface Transaction {
  id: string;
  type: string;
  amount: number;
  createdAt: Date;
  reason: string | null;
  performedBy: string | null;
}

interface CoinsAnalyticsProps {
  transactions: Transaction[];
  totalBalances: number;
  balanceCount: number;
  topBalance: number;
}

export function CoinsAnalytics({ transactions, totalBalances, balanceCount, topBalance }: CoinsAnalyticsProps) {
  const { credits, debits, refunds, adjustments, avgCredit, avgDebit } = useMemo(() => {
    const credits = transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + Math.abs(t.amount), 0);
    const debits = transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + Math.abs(t.amount), 0);
    const refunds = transactions.filter((t) => t.type === "REFUND").reduce((s, t) => s + Math.abs(t.amount), 0);
    const adjustments = transactions.filter((t) => t.type === "ADJUSTMENT").reduce((s, t) => s + Math.abs(t.amount), 0);
    const creditTxs = transactions.filter((t) => t.type === "CREDIT");
    const debitTxs = transactions.filter((t) => t.type === "DEBIT");
    const avgCredit = creditTxs.length > 0 ? Math.round(credits / creditTxs.length) : 0;
    const avgDebit = debitTxs.length > 0 ? Math.round(debits / debitTxs.length) : 0;
    return { credits, debits, refunds, adjustments, avgCredit, avgDebit };
  }, [transactions]);

  const avgBalance = balanceCount > 0 ? Math.round(totalBalances / balanceCount) : 0;
  const refundRate = credits > 0 ? Math.round((refunds / credits) * 100) : 0;
  const creditToDebitRatio = debits > 0 ? (credits / debits).toFixed(1) : "N/A";

  const monthlyActivity = useMemo(() => {
    const volumes: { credits: number; debits: number; net: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(NOW - i * 30 * 86400000);
      const monthEnd = new Date(NOW - (i - 1) * 30 * 86400000);
      const monthTxs = transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= monthStart && d < monthEnd;
      });
      volumes.push({
        credits: monthTxs.filter((t) => t.type === "CREDIT" || t.type === "REFUND")
          .reduce((s, t) => s + Math.abs(t.amount), 0),
        debits: monthTxs.filter((t) => t.type === "DEBIT")
          .reduce((s, t) => s + Math.abs(t.amount), 0),
        net: 0,
      });
    }
    return volumes;
  }, [transactions]);

  const topEarners = useMemo(() => {
    const byPerformer = new Map<string, number>();
    for (const t of transactions) {
      if ((t.type === "CREDIT" || t.type === "REFUND") && t.performedBy) {
        byPerformer.set(t.performedBy, (byPerformer.get(t.performedBy) || 0) + Math.abs(t.amount));
      }
    }
    return Array.from(byPerformer.entries()).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [transactions]);

  const topSpenders = useMemo(() => {
    const byPerformer = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "DEBIT" && t.performedBy) {
        byPerformer.set(t.performedBy, (byPerformer.get(t.performedBy) || 0) + Math.abs(t.amount));
      }
    }
    return Array.from(byPerformer.entries()).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [transactions]);

  const peakHours = useMemo(() => {
    const hourCounts = new Array(24).fill(0);
    for (const t of transactions) {
      const h = new Date(t.createdAt).getHours();
      hourCounts[h]++;
    }
    const peak = hourCounts.indexOf(Math.max(...hourCounts));
    return { peak, distribution: hourCounts };
  }, [transactions]);

  const velocity = useMemo(() => {
    if (transactions.length < 2) return 0;
    const sorted = [...transactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const first = new Date(sorted[0].createdAt).getTime();
    const last = new Date(sorted[sorted.length - 1].createdAt).getTime();
    const days = (last - first) / 86400000;
    return days > 0 ? Math.round(totalBalances / days) : 0;
  }, [transactions, totalBalances]);

  const recentRapidCycles = useMemo(() => {
    const byLicense = new Map<string, { adds: number; removes: number; lastAdd: number; lastRemove: number }>();
    const threshold = 24 * 60 * 60 * 1000;
    for (const t of transactions) {
      const key = t.performedBy || "unknown";
      const ts = new Date(t.createdAt).getTime();
      if (NOW - ts > 7 * 86400000) continue;
      if (!byLicense.has(key)) byLicense.set(key, { adds: 0, removes: 0, lastAdd: 0, lastRemove: 0 });
      const entry = byLicense.get(key)!;
      if (t.type === "CREDIT" || t.type === "REFUND") { entry.adds += Math.abs(t.amount); entry.lastAdd = ts; }
      if (t.type === "DEBIT") { entry.removes += Math.abs(t.amount); entry.lastRemove = ts; }
    }
    return Array.from(byLicense.entries())
      .filter(([, v]) => v.adds > 0 && v.removes > 0 && Math.abs(v.lastAdd - v.lastRemove) < threshold)
      .sort(([, a], [, b]) => (a.adds + a.removes) - (b.adds + b.removes))
      .slice(0, 5);
  }, [transactions]);

  const anomalyFlags = useMemo(() => {
    const flags: string[] = [];
    if (refundRate > 15) flags.push("High refund rate");
    if (topBalance > totalBalances * 0.3) flags.push("Concentrated balance");
    if (refunds > credits * 0.5) flags.push("Refunds approaching credits");
    if (recentRapidCycles.length > 0) flags.push("Rapid add/remove cycles detected");
    if (adjustments > credits * 0.2) flags.push("High adjustment volume");
    return flags;
  }, [refundRate, topBalance, totalBalances, refunds, credits, recentRapidCycles, adjustments]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat
          label="Avg Balance"
          value={avgBalance.toLocaleString()}
          trend={avgBalance > 1000 ? "up" : avgBalance > 100 ? "neutral" : "down"}
          trendLabel={`Across ${balanceCount} licenses`}
          color="#eab308"
        />
        <MiniStat
          label="Total Credits"
          value={credits.toLocaleString()}
          trend="up"
          trendLabel={`Avg ${avgCredit.toLocaleString()} per tx`}
          color="#22c55e"
        />
        <MiniStat
          label="Total Debits"
          value={debits.toLocaleString()}
          trend={debits > credits ? "down" : "up"}
          trendLabel={`Avg ${avgDebit.toLocaleString()} per tx`}
          color={debits > credits ? "#ef4444" : "#3b82f6"}
        />
        <MiniStat
          label="Circulation Velocity"
          value={`${velocity.toLocaleString()}/day`}
          trend={velocity > 1000 ? "up" : velocity > 100 ? "neutral" : "down"}
          trendLabel={`Credit:Debit ${creditToDebitRatio}`}
          color={Number(creditToDebitRatio) >= 1 ? "#22c55e" : "#ef4444"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <h3 className="font-semibold">Monthly Coin Volume (12 months)</h3>
          </div>
          <BarChart
            data={monthlyActivity.map((m, i) => ({
              label: `${i + 1}m ago`,
              value: Math.round((m.credits + m.debits) / 100),
              color: m.credits >= m.debits ? "#22c55e" : "#ef4444",
            }))}
            height={48}
          />
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>11 months ago</span>
            <span>This month</span>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            <h3 className="font-semibold">Transaction Insights</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Peak Transaction Hour</span>
              <span className="text-sm font-medium text-zinc-200">{peakHours.peak}:00 UTC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Most Common Reason</span>
              <span className="text-sm font-medium text-zinc-200">
                {(() => {
                  const reasons = new Map<string, number>();
                  transactions.forEach((t) => {
                    const r = t.reason || "Manual";
                    reasons.set(r, (reasons.get(r) || 0) + 1);
                  });
                  return Array.from(reasons.entries()).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";
                })()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Total Adjustments</span>
              <span className="text-sm font-medium text-yellow-400">{adjustments.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Average Transaction Value</span>
              <span className="text-sm font-medium text-zinc-200">
                {transactions.length > 0
                  ? Math.round((credits + debits + refunds + adjustments) / transactions.length).toLocaleString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className={anomalyFlags.length > 1 ? "text-red-400" : "text-green-400"} />
            <h3 className="font-semibold">Fraud Detection</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Refund Rate</span>
              <span className={`text-sm font-medium ${refundRate > 10 ? "text-red-400" : "text-green-400"}`}>
                {refundRate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Top Balance (single)</span>
              <span className="text-sm font-medium text-yellow-400">{topBalance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Anomaly Score</span>
              <span className={`text-sm font-medium ${anomalyFlags.length > 2 ? "text-red-400" : anomalyFlags.length > 0 ? "text-yellow-400" : "text-green-400"}`}>
                {anomalyFlags.length > 2 ? "High" : anomalyFlags.length > 0 ? "Medium" : "Low"}
              </span>
            </div>
          </div>
          {anomalyFlags.length > 0 && (
            <div className="mt-3 space-y-1">
              {anomalyFlags.map((flag, i) => (
                <div key={flag || i} className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertTriangle size={10} />
                  {flag}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            <h3 className="font-semibold">Top Earners</h3>
          </div>
          {topEarners.length > 0 ? (
            <div className="space-y-2">
              {topEarners.map(([performer, amount], i) => (
                <div key={performer || i} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-2.5">
                  <span className="text-sm text-zinc-300">{performer}</span>
                  <span className="text-sm font-medium text-green-400">+{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No earner data available</p>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown size={16} className="text-red-400" />
            <h3 className="font-semibold">Top Spenders</h3>
          </div>
          {topSpenders.length > 0 ? (
            <div className="space-y-2">
              {topSpenders.map(([performer, amount], i) => (
                <div key={performer || i} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-2.5">
                  <span className="text-sm text-zinc-300">{performer}</span>
                  <span className="text-sm font-medium text-red-400">{amount.toLocaleString()} debited</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No spender data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
