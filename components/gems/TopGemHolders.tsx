"use client";

import { useMemo } from "react";
import { Users, Trophy } from "lucide-react";

interface Holder {
  licenseId: string;
  organization: string;
  key: string;
  balance: number;
}

export function TopGemHolders({ holders }: { holders: Holder[] }) {
  const sorted = useMemo(() => {
    return [...holders].sort((a, b) => b.balance - a.balance).slice(0, 10);
  }, [holders]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-2 text-zinc-500">
          <Users size={18} />
          <span className="text-sm">No balances yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <Trophy size={16} className="text-purple-400" />
        Top Gem Holders
      </h3>
      <div className="space-y-2">
        {sorted.map((h, i) => (
          <div key={h.licenseId} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2">
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                i === 0 ? "bg-purple-500/20 text-purple-400" :
                i === 1 ? "bg-zinc-400/20 text-zinc-300" :
                i === 2 ? "bg-amber-700/20 text-amber-500" :
                "bg-zinc-700/50 text-zinc-500"
              }`}>{i + 1}</span>
              <div>
                <p className="text-sm font-medium text-zinc-200">{h.organization}</p>
                <p className="text-xs text-zinc-500 font-mono">{h.key}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-purple-400">{h.balance.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
