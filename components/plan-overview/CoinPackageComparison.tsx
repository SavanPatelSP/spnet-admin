"use client";

import { useState, useMemo } from "react";
import { cn, formatPrice } from "@/lib/shared";
import { COIN_PACKAGES, type CoinPackage } from "@/lib/constants";
import {
  COIN_FEATURES_BY_CATEGORY,
  getCoinCategories,
  getCoinComparison,
} from "@/lib/plan-config";
import { Package, Check, X, Search, TrendingUp, ArrowUpRight } from "lucide-react";

function fmt(n: number) { return n.toLocaleString(); }

const colorMap: Record<string, { text: string; border: string; bg: string; badge: string }> = {
  yellow: { text: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/10", badge: "bg-yellow-500/20 text-yellow-300" },
  amber: { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", badge: "bg-amber-500/20 text-amber-300" },
  orange: { text: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/10", badge: "bg-orange-500/20 text-orange-300" },
  blue: { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", badge: "bg-blue-500/20 text-blue-300" },
};

const COLORS = ["yellow", "amber", "orange", "blue"];

function getPkgColor(pkg: CoinPackage) {
  const idx = COIN_PACKAGES.findIndex((p) => p.label === pkg.label);
  const key = COLORS[idx >= 0 ? idx % COLORS.length : 0];
  return colorMap[key] || colorMap.yellow;
}

function PackageSelect({ value, onChange, label, packages }: {
  value: string; onChange: (v: string) => void; label: string; packages: CoinPackage[];
}) {
  const pkg = packages.find((p) => p.label === value);
  const c = getPkgColor(pkg || packages[0]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-xl border bg-zinc-900 px-4 py-2.5 pr-10 text-sm font-medium text-zinc-100 transition-colors",
            c.border,
            "focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          )}
        >
          {packages.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label} — {fmt(p.amount)} coins at {formatPrice(p.price, p.currency)}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <Search size={14} className="text-zinc-500" />
        </div>
      </div>
    </div>
  );
}

function PackageHeader({ pkg }: { pkg: CoinPackage }) {
  const c = getPkgColor(pkg);
  const efficiency = useMemo(() => {
    const base = COIN_PACKAGES[0];
    const expected = (pkg.amount / base.amount) * base.price;
    return (expected / pkg.price) * 100;
  }, [pkg]);

  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-2xl border bg-zinc-900 p-5 text-center", c.border)}>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", c.bg)}>
        <Package size={24} className={c.text} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-zinc-100">{pkg.label}</h3>
        <span className={cn("mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", c.badge)}>
          {fmt(pkg.amount)} Coins
        </span>
      </div>
      <div>
        <span className="text-2xl font-bold text-zinc-100">{formatPrice(pkg.price, pkg.currency)}</span>
        <span className="ml-1 text-sm text-zinc-500">total</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-zinc-500">
        <span>{(pkg.price / pkg.amount).toFixed(4)} per coin</span>
        <span className="text-zinc-700">|</span>
        <span className={cn(
          "flex items-center gap-0.5 font-medium",
          efficiency > 110 ? "text-green-400" : efficiency > 100 ? "text-blue-400" : "text-zinc-400"
        )}>
          <TrendingUp size={12} />
          {efficiency.toFixed(0)}% value
        </span>
      </div>
      <p className="text-xs text-zinc-500">{pkg.description}</p>
    </div>
  );
}

function FeatureRow({ feature, hasFirst, hasSecond, isDiff }: { feature: string; hasFirst: boolean; hasSecond: boolean; isDiff: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg px-3 py-2 text-xs sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-3",
        isDiff ? (hasSecond ? "bg-green-950/20" : "bg-red-950/20") : "bg-zinc-900/30"
      )}
    >
      <span className={cn(isDiff ? (hasSecond ? "text-green-300" : "text-red-300 line-through") : "text-zinc-400")}>
        {feature}
      </span>
      <div className="flex items-center justify-between sm:justify-center">
        <span className="text-zinc-500 sm:hidden">Package A</span>
        {hasFirst ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-zinc-600" />}
      </div>
      <div className="flex items-center justify-between sm:justify-center">
        <span className="text-zinc-500 sm:hidden">Package B</span>
        {hasSecond ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-zinc-600" />}
      </div>
    </div>
  );
}

export function CoinPackageComparison() {
  const packages = COIN_PACKAGES;
  const [firstLabel, setFirstLabel] = useState(packages[0].label);
  const [secondLabel, setSecondLabel] = useState(packages[packages.length - 1].label);

  const first = packages.find((p) => p.label === firstLabel)!;
  const second = packages.find((p) => p.label === secondLabel)!;

  const features1 = COIN_FEATURES_BY_CATEGORY[first?.label || ""] || {};
  const features2 = COIN_FEATURES_BY_CATEGORY[second?.label || ""] || {};
  const allCategories = [...new Set([...getCoinCategories(first?.label || ""), ...getCoinCategories(second?.label || "")])];

  const categoryData = useMemo(() => {
    return allCategories.map((cat) => {
      const f1 = features1[cat] || [];
      const f2 = features2[cat] || [];
      const f1Set = new Set(f1);
      const f2Set = new Set(f2);
      return {
        category: cat,
        common: f1.filter((f) => f2Set.has(f)),
        added: f2.filter((f) => !f1Set.has(f)),
        removed: f1.filter((f) => !f2Set.has(f)),
      };
    });
  }, [firstLabel, secondLabel]);

  if (!first || !second) return null;

  const basePrice = packages[0].price;
  const baseAmount = packages[0].amount;
  const firstExpected = (first.amount / baseAmount) * basePrice;
  const secondExpected = (second.amount / baseAmount) * basePrice;
  const firstEfficiency = (firstExpected / first.price) * 100;
  const secondEfficiency = (secondExpected / second.price) * 100;

  const metricRows = [
    { label: "Coin Amount", first: fmt(first.amount), second: fmt(second.amount), better: first.amount > second.amount ? 1 : first.amount < second.amount ? -1 : 0 },
    { label: "Package Price", first: formatPrice(first.price, first.currency), second: formatPrice(second.price, second.currency), better: first.price < second.price ? 1 : first.price > second.price ? -1 : 0 },
    { label: "Per Coin", first: (first.price / first.amount).toFixed(4), second: (second.price / second.amount).toFixed(4), better: (first.price / first.amount) < (second.price / second.amount) ? 1 : (first.price / first.amount) > (second.price / second.amount) ? -1 : 0 },
    { label: "Value Score", first: `${firstEfficiency.toFixed(0)}%`, second: `${secondEfficiency.toFixed(0)}%`, better: firstEfficiency > secondEfficiency ? 1 : firstEfficiency < secondEfficiency ? -1 : 0 },
  ];

  const { added: allAdded } = getCoinComparison(first.label, second.label);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <PackageSelect value={firstLabel} onChange={setFirstLabel} label="Package A" packages={packages} />
        <PackageSelect value={secondLabel} onChange={setSecondLabel} label="Package B" packages={packages} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PackageHeader pkg={first} />
        <PackageHeader pkg={second} />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Metrics</h4>
        <div className="space-y-2">
          {metricRows.map(({ label, first: fv, second: sv, better }) => (
            <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg px-3 py-2 text-xs">
              <span className="font-medium text-zinc-400">{label}</span>
              <span className={cn("text-right font-medium", better === 1 ? "text-green-400" : better === -1 ? "text-zinc-300" : "text-zinc-400")}>
                {fv}
              </span>
              <span className={cn("text-right font-medium", better === -1 ? "text-green-400" : better === 1 ? "text-zinc-300" : "text-zinc-400")}>
                {sv}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Features by Category</h4>
        {categoryData.map(({ category, common, added, removed }) => {
          if (common.length === 0 && added.length === 0 && removed.length === 0) return null;
          return (
            <div key={category} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h5 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">{category}</h5>
              <div className="space-y-2">
                {common.map((f) => (
                  <FeatureRow key={f} feature={f} hasFirst={true} hasSecond={true} isDiff={false} />
                ))}
                {added.map((f) => (
                  <FeatureRow key={f} feature={f} hasFirst={false} hasSecond={true} isDiff={true} />
                ))}
                {removed.map((f) => (
                  <FeatureRow key={f} feature={f} hasFirst={true} hasSecond={false} isDiff={true} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-900/30 p-5">
        <h4 className="mb-3 text-sm font-bold text-zinc-300">Upgrade Path</h4>
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="font-medium text-zinc-200">{first.label}</span>
          <ArrowUpRight size={14} className="text-green-500" />
          <span className="text-zinc-500">
            {second.amount > first.amount
              ? `${fmt(second.amount - first.amount)} additional coins for ${formatPrice(second.price - first.price, second.currency)} more`
              : `${fmt(first.amount - second.amount)} fewer coins, saving ${formatPrice(first.price - second.price, second.currency)}`}
          </span>
          <span className="font-medium text-zinc-200">{second.label}</span>
        </div>
        {second.amount > first.amount && (
          <div className="mt-2 text-xs text-zinc-500">
            Cost per additional coin: {((second.price - first.price) / (second.amount - first.amount)).toFixed(4)}
          </div>
        )}
        {allAdded.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-green-400">Upgrading adds:</p>
            <ul className="space-y-1">
              {allAdded.slice(0, 5).map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-400">
                  <Check size={12} className="mt-0.5 shrink-0 text-green-500" />
                  {f}
                </li>
              ))}
              {allAdded.length > 5 && <li className="text-xs text-zinc-500">+{allAdded.length - 5} more</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
