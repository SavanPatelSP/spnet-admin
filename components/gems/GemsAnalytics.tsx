"use client";

import { useMemo, useState, useEffect } from "react";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { MiniStat } from "@/components/ui/Chart";
import { Gem, TrendingUp, TrendingDown, Activity, Award } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  createdAt: Date;
  reason: string | null;
  performedBy: string | null;
}

interface Props {
  transactions: Transaction[];
  totalGems: number;
  balanceCount: number;
  topBalance?: number;
  rewardCount?: number;
}

export function GemsAnalytics({ transactions, totalGems, balanceCount }: Props) {
  const [analytics, setAnalytics] = useState({
    totalGranted: 0,
    totalRevoked: 0,
    rewardTransactions: 0,
    avgBalance: 0,
    revokeRate: 0,
    anomalyScore: "Low" as string,
    avgGrant: 0,
    avgReward: 0,
    rewardTotal: 0,
    monthly: [] as number[],
  });

  useEffect(() => {
    const totalGranted = transactions
      .filter((t) => t.type === "GRANT" || t.type === "REWARD")
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const totalRevoked = transactions
      .filter((t) => t.type === "REVOKE")
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const rewards = transactions.filter((t) => t.type === "REWARD");
    const rewardTransactions = rewards.length;
    const rewardTotal = rewards.reduce((s, t) => s + Math.abs(t.amount), 0);
    const avgBalance = balanceCount > 0 ? Math.round(totalGems / balanceCount) : 0;
    const revokeRate = totalGranted > 0 ? Math.round((totalRevoked / totalGranted) * 100) : 0;

    const grantTxs = transactions.filter((t) => t.type === "GRANT");
    const avgGrant = grantTxs.length > 0 ? Math.round(totalGranted / grantTxs.length) : 0;
    const avgReward = rewardTransactions > 0 ? Math.round(rewardTotal / rewardTransactions) : 0;

    const now = Date.now();
    const monthly: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now - i * 30 * 86400000);
      const end = new Date(now - (i - 1) * 30 * 86400000);
      monthly.push(transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= start && d < end;
      }).length);
    }

    const anomalyScore = revokeRate > 50 ? "High" : revokeRate > 20 ? "Medium" : "Low";

    const t = setTimeout(() => {
      setAnalytics({
        totalGranted, totalRevoked, rewardTransactions, avgBalance,
        revokeRate, anomalyScore, avgGrant, avgReward, rewardTotal, monthly,
      });
    }, 0);
    return () => clearTimeout(t);
  }, [transactions, totalGems, balanceCount]);

  const peakDay = useMemo(() => {
    const dayCounts = new Array(7).fill(0);
    for (const t of transactions) {
      dayCounts[new Date(t.createdAt).getDay()]++;
    }
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const max = Math.max(...dayCounts);
    return max > 0 ? days[dayCounts.indexOf(max)] : "N/A";
  }, [transactions]);

  return (
    <div className="space-y-6">
      <StatCardGrid columns={4}>
        <StatCard
          title="Avg Balance"
          value={analytics.avgBalance.toLocaleString()}
          icon={Gem}
          color={analytics.avgBalance > 1000 ? "purple" : "default"}
          subtitle={`Across ${balanceCount} balance${balanceCount !== 1 ? "s" : ""}`}
        />
        <StatCard
          title="Total Granted"
          value={analytics.totalGranted.toLocaleString()}
          icon={TrendingUp}
          color="green"
          subtitle={`Avg ${analytics.avgGrant.toLocaleString()} per grant`}
        />
        <StatCard
          title="Total Revoked"
          value={analytics.totalRevoked.toLocaleString()}
          icon={TrendingDown}
          color={analytics.totalRevoked > 0 ? "red" : "default"}
          subtitle={`${transactions.filter((t) => t.type === "REVOKE").length} transactions`}
        />
        <StatCard
          title="Reward Claims"
          value={analytics.rewardTransactions}
          icon={Award}
          color="blue"
          subtitle={`${analytics.rewardTotal.toLocaleString()} gems via rewards`}
        />
      </StatCardGrid>

      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat
          label="Grant : Revoke"
          value={analytics.totalRevoked > 0
            ? (analytics.totalGranted / analytics.totalRevoked).toFixed(1)
            : "∞"}
          trend={analytics.revokeRate > 50 ? "down" : analytics.revokeRate > 20 ? "neutral" : "up"}
          trendLabel=": 1 ratio"
          color={analytics.revokeRate > 50 ? "#ef4444" : analytics.revokeRate > 20 ? "#eab308" : "#22c55e"}
        />
        <MiniStat
          label="Avg Reward"
          value={analytics.avgReward.toLocaleString()}
          trend="up"
          trendLabel="per claim"
          color="#a855f7"
        />
        <MiniStat
          label="Peek Day"
          value={peakDay}
          trend="neutral"
          trendLabel="Most active"
          color="#3b82f6"
        />
        <MiniStat
          label="Anomaly Score"
          value={analytics.anomalyScore}
          trend={
            analytics.anomalyScore === "High" ? "down" :
            analytics.anomalyScore === "Medium" ? "neutral" : "up"
          }
          trendLabel={`${analytics.revokeRate}% revoke rate`}
          color={
            analytics.anomalyScore === "High" ? "#ef4444" :
            analytics.anomalyScore === "Medium" ? "#eab308" : "#22c55e"
          }
        />
      </div>

      {analytics.monthly.some((c) => c > 0) && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={16} className="text-purple-400" />
            <h3 className="font-semibold">Monthly Transaction Volume (12 months)</h3>
          </div>
          <div className="flex items-end gap-1.5">
            {analytics.monthly.map((c, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-purple-500/60"
                  style={{ height: `${Math.max(4, (c / Math.max(...analytics.monthly)) * 48)}px` }}
                />
                <span className="text-[10px] text-zinc-500">{c}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
            <span>11 months ago</span>
            <span>This month</span>
          </div>
        </div>
      )}
    </div>
  );
}
