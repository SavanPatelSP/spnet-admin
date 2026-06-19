"use client";

import { useState } from "react";
import { cn } from "@/lib/shared";
import { COIN_PACKAGES, type CoinPackage } from "@/lib/constants";
import { CoinPackageComparison } from "./CoinPackageComparison";
import { Coins, Package, ShoppingCart, Check, ArrowRight, ChevronDown, ChevronRight, DollarSign } from "lucide-react";

function fmt(n: number) { return n.toLocaleString(); }

const colorMap: Record<string, { text: string; border: string; bg: string; badge: string }> = {
  yellow: { text: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/10", badge: "bg-yellow-500/20 text-yellow-300" },
  amber: { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", badge: "bg-amber-500/20 text-amber-300" },
  orange: { text: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/10", badge: "bg-orange-500/20 text-orange-300" },
  blue: { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", badge: "bg-blue-500/20 text-blue-300" },
};

const COLORS = ["yellow", "amber", "orange", "blue"];

const BENEFITS: Record<string, string[]> = {
  Starter: ["Basic access to platform tools", "Entry-level engagement", "Ideal for testing and evaluation"],
  Growth: ["All Starter benefits", "Standard operational capacity", "Suitable for small teams", "Better value per coin"],
  Pro: ["All Growth benefits", "Professional-grade capacity", "Priority operations", "Best value in mid-range"],
  Enterprise: ["Maximum coin capacity", "Enterprise-scale operations", "Highest efficiency", "Best overall value"],
};

function CoinPackageCard({ pkg, index, onViewDetails }: { pkg: CoinPackage; index: number; onViewDetails: () => void }) {
  const colorKey = COLORS[index % COLORS.length];
  const c = colorMap[colorKey] || colorMap.yellow;
  const benefits = BENEFITS[pkg.label] || [];

  return (
    <div className={cn("group relative flex flex-col rounded-2xl border bg-zinc-900 p-6 transition-all duration-300 hover:-translate-y-0.5", c.border, "hover:shadow-lg")}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.bg)}>
            <Package size={20} className={c.text} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">{pkg.label}</h3>
            <span className={cn("mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", c.badge)}>
              {fmt(pkg.amount)} Coins
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-lg font-bold", c.text)}>{pkg.currency}{pkg.price.toLocaleString()}</div>
          <div className="text-[10px] text-zinc-600">{(pkg.price / pkg.amount).toFixed(4)} per coin</div>
        </div>
      </div>

      {pkg.description && (
        <p className="mb-4 text-sm leading-relaxed text-zinc-500">{pkg.description}</p>
      )}

      <div className="mb-5 space-y-2">
        {benefits.slice(0, 3).map((b) => (
          <div key={b} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
            <span className="text-xs leading-relaxed text-zinc-400">{b}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex gap-2">
        <button
          onClick={onViewDetails}
          className={cn("flex-1 rounded-xl py-2 text-xs font-medium transition-colors", c.bg, c.text, "hover:opacity-80")}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

function CoinPackageDetail({ pkg, onClose }: { pkg: CoinPackage; onClose: () => void }) {
  const benefits = BENEFITS[pkg.label] || [
    "Access to platform economy features",
    "Engagement and reward capabilities",
    "Standard operational support",
  ];

  return (
    <div className="space-y-6">
      <div className={cn("flex items-start gap-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5")}>
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-500/10">
          <Package size={28} className="text-yellow-400" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100">{pkg.label}</h2>
            <span className="rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-yellow-300">
              {fmt(pkg.amount)} Coins
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{pkg.description}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-200">
              {pkg.currency}{pkg.price.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500">
              {(pkg.price / pkg.amount).toFixed(4)} per coin
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          Close
        </button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-zinc-300">Benefits</h3>
        <ul className="space-y-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-zinc-400">
              <Check size={16} className="mt-0.5 shrink-0 text-green-500" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-bold text-zinc-300">Package Details</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="text-zinc-500">Package Name</div>
          <div className="font-medium text-zinc-200">{pkg.label}</div>
          <div className="text-zinc-500">Coin Amount</div>
          <div className="font-medium text-yellow-400">{fmt(pkg.amount)}</div>
          <div className="text-zinc-500">Value</div>
          <div className="font-medium text-zinc-200">{pkg.currency}{pkg.price.toLocaleString()}</div>
          <div className="text-zinc-500">Unit Price</div>
          <div className="text-zinc-400">{(pkg.price / pkg.amount).toFixed(4)} per coin</div>
          <div className="text-zinc-500">Package Position</div>
          <div className="text-zinc-400">Tier {COIN_PACKAGES.findIndex((p) => p.amount === pkg.amount) + 1} of {COIN_PACKAGES.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-bold text-zinc-300">Comparison</h3>
        <div className="space-y-3">
          {COIN_PACKAGES.map((other) => {
            if (other.amount === pkg.amount) return null;
            const ratio = other.amount / pkg.amount;
            const valueRatio = other.price / pkg.price;
            return (
              <div key={other.label} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-zinc-500" />
                  <span className="text-sm text-zinc-300">{other.label}</span>
                  <span className="text-xs text-zinc-500">({fmt(other.amount)} coins)</span>
                </div>
                <div className="text-xs text-zinc-500">
                  {ratio > 1
                    ? `${ratio.toFixed(1)}x the coins at ${valueRatio.toFixed(1)}x the price`
                    : `${(1 / ratio).toFixed(1)}x fewer coins at ${(1 / valueRatio).toFixed(1)}x the price`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type ViewMode = "grid" | "compare";

export function CoinPackageOverview() {
  const [selected, setSelected] = useState<CoinPackage | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
            <Coins size={20} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Coin Packages</h2>
            <p className="text-sm text-zinc-500">Virtual currency packages for platform economy operations. {COIN_PACKAGES.length} packages available.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
              viewMode === "grid" ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode("compare")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
              viewMode === "compare" ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Compare Packages
          </button>
        </div>
      </div>

      {viewMode === "compare" && <CoinPackageComparison />}

      {selected ? (
        <CoinPackageDetail pkg={selected} onClose={() => setSelected(null)} />
      ) : viewMode === "grid" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COIN_PACKAGES.map((pkg, i) => (
              <CoinPackageCard
                key={pkg.label}
                pkg={pkg}
                index={i}
                onViewDetails={() => setSelected(pkg)}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="mb-4 text-sm font-bold text-zinc-300">Package Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Package</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Coins</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Price</th>
                    <th className="hidden pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">Per Coin</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Value Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {COIN_PACKAGES.map((pkg, i) => {
                    const basePrice = COIN_PACKAGES[0].price;
                    const baseAmount = COIN_PACKAGES[0].amount;
                    const expectedPrice = (pkg.amount / baseAmount) * basePrice;
                    const efficiency = (expectedPrice / pkg.price) * 100;
                    return (
                      <tr key={pkg.label} className="group hover:bg-zinc-800/30">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-yellow-400" />
                            <span className="font-medium text-zinc-200">{pkg.label}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-zinc-300">{fmt(pkg.amount)}</td>
                        <td className="py-3 text-right font-medium text-zinc-200">{pkg.currency}{pkg.price.toLocaleString()}</td>
                        <td className="hidden py-3 text-right text-zinc-500 sm:table-cell">{(pkg.price / pkg.amount).toFixed(4)}</td>
                        <td className="py-3 text-right">
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            efficiency > 110 ? "bg-green-500/20 text-green-400" :
                            efficiency > 100 ? "bg-blue-500/20 text-blue-400" :
                            "bg-zinc-800 text-zinc-400"
                          )}>
                            {efficiency.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
