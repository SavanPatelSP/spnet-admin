"use client";

import { useMemo } from "react";
import { ArrowRightFromLine, ArrowLeftFromLine, TrendingUp } from "lucide-react";

interface CoinTransaction {
  id: string;
  type: string;
  amount: number;
  reason: string | null;
  performedBy: string | null;
  createdAt: Date;
}

export function SourceSinkTracking({ transactions }: { transactions: CoinTransaction[] }) {
  const sources = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "CREDIT") {
        const reason = t.reason || "Unknown";
        map.set(reason, (map.get(reason) || 0) + t.amount);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [transactions]);

  const sinks = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "DEBIT") {
        const reason = t.reason || "Unknown";
        map.set(reason, (map.get(reason) || 0) + Math.abs(t.amount));
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [transactions]);

  const totalSource = sources.reduce((s, [, v]) => s + v, 0);
  const totalSink = sinks.reduce((s, [, v]) => s + v, 0);

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-2 text-zinc-500">
          <TrendingUp size={18} />
          <span className="text-sm">No transaction data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <TrendingUp size={16} className="text-blue-400" />
        Source / Sink Tracking
      </h3>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-green-400">
            <ArrowRightFromLine size={12} />
            Sources ({totalSource.toLocaleString()})
          </h4>
          <div className="space-y-1.5">
            {sources.map(([reason, amount]) => (
              <div key={reason} className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-1.5">
                <span className="truncate text-xs text-zinc-400">{reason}</span>
                <span className="ml-2 shrink-0 text-xs font-medium text-green-400">+{amount.toLocaleString()}</span>
              </div>
            ))}
            {sources.length === 0 && <p className="text-xs text-zinc-600">No sources found</p>}
          </div>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <ArrowLeftFromLine size={12} />
            Sinks ({totalSink.toLocaleString()})
          </h4>
          <div className="space-y-1.5">
            {sinks.map(([reason, amount]) => (
              <div key={reason} className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-1.5">
                <span className="truncate text-xs text-zinc-400">{reason}</span>
                <span className="ml-2 shrink-0 text-xs font-medium text-red-400">-{amount.toLocaleString()}</span>
              </div>
            ))}
            {sinks.length === 0 && <p className="text-xs text-zinc-600">No sinks found</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
