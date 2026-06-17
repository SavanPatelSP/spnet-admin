"use client";

import { useMemo } from "react";
import { Activity, ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle } from "lucide-react";

interface Transaction {
  type: string;
  amount: number;
  createdAt: Date;
}

interface EconomyHealthPanelProps {
  transactions: Transaction[];
  totalSupply: number;
  activeHolders: number;
}

export function EconomyHealthPanel({ transactions, totalSupply, activeHolders }: EconomyHealthPanelProps) {
  const stats = useMemo(() => {
    const credits = transactions.filter((t) => t.type === "CREDIT");
    const debits = transactions.filter((t) => t.type === "DEBIT");
    const totalInflow = credits.reduce((s, t) => s + t.amount, 0);
    const totalOutflow = debits.reduce((s, t) => s + Math.abs(t.amount), 0);

    const recentTxs = transactions.slice(-100);
    const velocity = recentTxs.length > 0
      ? Math.round((recentTxs.reduce((s, t) => s + Math.abs(t.amount), 0) / recentTxs.length) * 10) / 10
      : 0;

    const zeroBalance = activeHolders === 0 ? 100
      : Math.round(((activeHolders - transactions.length) / activeHolders) * 100);

    return { totalInflow, totalOutflow, velocity, zeroBalance, recentCount: recentTxs.length };
  }, [transactions, activeHolders]);

  const healthScore = useMemo(() => {
    let score = 100;
    if (stats.totalOutflow > stats.totalInflow) score -= 15;
    if (stats.zeroBalance > 50) score -= 10;
    if (stats.velocity < 10) score -= 5;
    if (activeHolders < 5) score -= 20;
    return Math.max(0, score);
  }, [stats, activeHolders]);

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-2 text-zinc-500">
          <Activity size={18} />
          <span className="text-sm">No transaction data yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <Activity size={16} className="text-green-400" />
        Economy Health
      </h3>

      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
          healthScore >= 80 ? "bg-green-500/20 text-green-400" :
          healthScore >= 50 ? "bg-yellow-500/20 text-yellow-400" :
          "bg-red-500/20 text-red-400"
        }`}>{healthScore}</div>
        <div>
          <p className="text-sm font-medium text-zinc-200">Health Score</p>
          <p className="text-xs text-zinc-500">Based on circulation, concentration, and activity</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <ArrowUpRight size={12} className="text-green-400" />
            Total Inflow
          </p>
          <p className="mt-1 text-sm font-bold text-green-400">{stats.totalInflow.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <ArrowDownRight size={12} className="text-red-400" />
            Total Outflow
          </p>
          <p className="mt-1 text-sm font-bold text-red-400">{stats.totalOutflow.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <Wallet size={12} />
            Supply
          </p>
          <p className="mt-1 text-sm font-bold text-yellow-400">{totalSupply.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <AlertTriangle size={12} />
            Dormant Licenses
          </p>
          <p className="mt-1 text-sm font-bold text-yellow-400">{stats.zeroBalance}%</p>
        </div>
      </div>
    </div>
  );
}
