"use client";

import { useMemo, useState, useEffect } from "react";
import { Shield, AlertTriangle, Users } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  createdAt: Date;
  reason: string | null;
  performedBy: string | null;
}

interface AntiAbusePanelProps {
  transactions: Transaction[];
}

export default function AntiAbusePanel({ transactions }: AntiAbusePanelProps) {
  const revokeRate = useMemo(() => {
    const totalGranted = transactions
      .filter((t) => t.type === "GRANT" || t.type === "REWARD")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalRevoked = transactions
      .filter((t) => t.type === "REVOKE")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return totalGranted > 0 ? Math.round((totalRevoked / totalGranted) * 100) : 0;
  }, [transactions]);

  const [abuseMetrics, setAbuseMetrics] = useState({
    recentCount: 0,
    hourlyCount: 0,
    highFrequency: [] as [string, { count: number; totalAmount: number }][],
    patternScore: "Low" as string,
    revokeRate: 0,
  });

  useEffect(() => {
    const now = Date.now();
    const dayAgo = now - 86400000;
    const hourAgo = now - 3600000;

    const recentTxs = transactions.filter((t) => new Date(t.createdAt).getTime() > dayAgo);
    const hourlyTxs = transactions.filter((t) => new Date(t.createdAt).getTime() > hourAgo);

    const grantFreq = new Map<string, { count: number; totalAmount: number }>();
    for (const t of transactions) {
      if (t.type === "GRANT" || t.type === "REWARD") {
        const key = t.performedBy || "system";
        const existing = grantFreq.get(key) || { count: 0, totalAmount: 0 };
        existing.count++;
        existing.totalAmount += Math.abs(t.amount);
        grantFreq.set(key, existing);
      }
    }

    const highFrequency = Array.from(grantFreq.entries())
      .filter(([, v]) => v.count > 10)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5);

    const patternScore = revokeRate > 50 ? "High" : revokeRate > 20 ? "Medium" : "Low";

    const t = setTimeout(() => {
      setAbuseMetrics({
        recentCount: recentTxs.length,
        hourlyCount: hourlyTxs.length,
        highFrequency,
        patternScore,
        revokeRate,
      });
    }, 0);
    return () => clearTimeout(t);
  }, [transactions, revokeRate]);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Shield size={16} className="text-purple-400" />
        <h3 className="font-semibold">Anti-Abuse Monitoring</h3>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">24h Volume</p>
          <p className="text-lg font-bold text-zinc-200">{abuseMetrics.recentCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Hourly Volume</p>
          <p className="text-lg font-bold text-zinc-200">{abuseMetrics.hourlyCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Pattern Score</p>
          <p className={`text-lg font-bold ${
            abuseMetrics.patternScore === "High" ? "text-red-400" :
            abuseMetrics.patternScore === "Medium" ? "text-yellow-400" : "text-green-400"
          }`}>
            {abuseMetrics.patternScore}
          </p>
        </div>
      </div>

      {abuseMetrics.highFrequency.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-sm text-yellow-400">
            <AlertTriangle size={14} />
            <span className="font-medium">High Grant Frequency Detected</span>
          </div>
          <div className="space-y-1.5">
            {abuseMetrics.highFrequency.map(([actor, data], i) => (
              <div key={actor || i} className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-zinc-500" />
                  <span className="text-sm text-zinc-300">{actor}</span>
                </div>
                <span className="text-xs text-zinc-400">
                  {data.count} grants ({data.totalAmount.toLocaleString()} gems)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {abuseMetrics.highFrequency.length === 0 && (
        <p className="text-sm text-zinc-500">No suspicious patterns detected.</p>
      )}
    </div>
  );
}
