"use client";

import { useState } from "react";
import { cn, formatPrice } from "@/lib/shared";
import { GEM_PACKAGES, type GemPackage } from "@/lib/constants";
import { GemPackageComparison } from "./GemPackageComparison";
import { Gem, Package, Check, Crown, Shield, ArrowRight } from "lucide-react";

function fmt(n: number) { return n.toLocaleString(); }

const colorMap: Record<string, { text: string; border: string; bg: string; badge: string }> = {
  blue: { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", badge: "bg-blue-500/20 text-blue-300" },
  indigo: { text: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/10", badge: "bg-indigo-500/20 text-indigo-300" },
  purple: { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10", badge: "bg-purple-500/20 text-purple-300" },
  violet: { text: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/10", badge: "bg-violet-500/20 text-violet-300" },
};

const COLORS = ["blue", "indigo", "purple", "violet"];

const POSITIONING: Record<string, string> = {
  Starter: "Entry-level gem pack for quick engagement and small rewards",
  Growth: "Mid-volume pack with improved value per gem",
  Pro: "Premium reward pack with full purchasing power unlocks",
  Enterprise: "Enterprise-scale grant pack with maximum efficiency",
};

function getPkgColor(pkg: GemPackage) {
  const idx = GEM_PACKAGES.findIndex((p) => p.label === pkg.label);
  const key = COLORS[idx >= 0 ? idx % COLORS.length : 0];
  return colorMap[key] || colorMap.blue;
}

function GemPackageCard({ pkg, index, onViewDetails, onCompare }: { pkg: GemPackage; index: number; onViewDetails: () => void; onCompare: () => void }) {
  const c = getPkgColor(pkg);
  const idx = GEM_PACKAGES.findIndex((p) => p.label === pkg.label);
  const premiumEligible = pkg.amount >= 100;
  const licenseEligible = pkg.amount >= 50;

  return (
    <div className={cn("group relative flex flex-col rounded-2xl border bg-zinc-900 p-5 transition-all duration-300 hover:-translate-y-0.5", c.border, "hover:shadow-lg")}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.bg)}>
            <Package size={20} className={c.text} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">{pkg.label}</h3>
            <span className={cn("mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", c.badge)}>
              {fmt(pkg.amount)} Gems
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-lg font-bold", c.text)}>{formatPrice(pkg.price, pkg.currency)}</div>
          <div className="text-[10px] text-zinc-600">{(pkg.price / pkg.amount).toFixed(2)} per gem</div>
        </div>
      </div>

      <div className="mb-1 flex items-center gap-1 text-xs text-zinc-600">
        <span>Pack {idx + 1} of {GEM_PACKAGES.length}</span>
        <ArrowRight size={10} />
      </div>

      <p className="mb-3 text-sm leading-relaxed text-zinc-500">{pkg.description}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {premiumEligible && (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
            <Crown size={10} /> Premium Power
          </span>
        )}
        {licenseEligible && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
            <Shield size={10} /> License Power
          </span>
        )}
        {!premiumEligible && !licenseEligible && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
            Basic Rewards
          </span>
        )}
      </div>

      <div className="mb-4 space-y-1.5">
        {[
          idx > 0 ? `${fmt(pkg.amount - GEM_PACKAGES[idx - 1].amount)} more gems than ${GEM_PACKAGES[idx - 1].label}` : "Entry point into the gem economy",
          `${(pkg.price / pkg.amount).toFixed(2)} cost per gem`,
          POSITIONING[pkg.label],
        ].slice(0, 3).map((b) => (
          <div key={b} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
            <span className="text-xs leading-relaxed text-zinc-400">{b}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          onClick={onViewDetails}
          className={cn("flex-1 rounded-xl py-2 text-xs font-medium transition-colors", c.bg, c.text, "hover:opacity-80")}
        >
          View Details
        </button>
        <button
          onClick={onCompare}
          className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          Compare
        </button>
      </div>
    </div>
  );
}

function GemPackageDetail({ pkg, onClose }: { pkg: GemPackage; onClose: () => void }) {
  const idx = GEM_PACKAGES.findIndex((p) => p.label === pkg.label);
  const c = getPkgColor(pkg);
  const premiumEligible = pkg.amount >= 100;
  const licenseEligible = pkg.amount >= 50;

  return (
    <div className="space-y-6">
      <div className={cn("flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-start", c.border, c.bg)}>
        <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl", c.bg)}>
          <Package size={28} className={c.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100">{pkg.label}</h2>
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", c.badge)}>
              {fmt(pkg.amount)} Gems
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{pkg.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-zinc-200">{formatPrice(pkg.price, pkg.currency)}</span>
            <span className="text-xs text-zinc-500">{(pkg.price / pkg.amount).toFixed(2)} per gem</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {premiumEligible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                <Crown size={10} /> Premium purchasing power
              </span>
            )}
            {licenseEligible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                <Shield size={10} /> License purchasing power
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          Close
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-bold text-zinc-300">Package Details</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div className="text-zinc-500">Package Name</div>
          <div className="font-medium text-zinc-200">{pkg.label}</div>
          <div className="text-zinc-500">Gem Amount</div>
          <div className="font-medium text-blue-400">{fmt(pkg.amount)}</div>
          <div className="text-zinc-500">Price</div>
          <div className="font-medium text-zinc-200">{formatPrice(pkg.price, pkg.currency)}</div>
          <div className="text-zinc-500">Unit Price</div>
          <div className="text-zinc-400">{(pkg.price / pkg.amount).toFixed(2)} per gem</div>
          <div className="text-zinc-500">Pack Position</div>
          <div className="text-zinc-400">Pack {idx + 1} of {GEM_PACKAGES.length}</div>
          <div className="text-zinc-500">Value Proposition</div>
          <div className="text-zinc-300">{POSITIONING[pkg.label]}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-bold text-zinc-300">Upgrade Progression</h3>
        <div className="space-y-3">
          {GEM_PACKAGES.map((other) => {
            if (other.label === pkg.label) return null;
            const ratio = other.amount / pkg.amount;
            const valueRatio = other.price / pkg.price;
            return (
              <div key={other.label} className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-zinc-500" />
                  <span className="text-sm text-zinc-300">{other.label}</span>
                  <span className="text-xs text-zinc-500">({fmt(other.amount)} gems)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {other.amount >= 100 && <Crown size={12} className="text-yellow-500" />}
                  {other.amount >= 50 && other.amount < 100 && <Shield size={12} className="text-blue-400" />}
                  <span className="text-xs text-zinc-500">
                    {ratio > 1
                      ? `${ratio.toFixed(0)}x gems at ${valueRatio.toFixed(1)}x price`
                      : `${(1 / ratio).toFixed(0)}x fewer gems at ${(1 / valueRatio).toFixed(1)}x price`}
                  </span>
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

export function GemPackageOverview() {
  const [selected, setSelected] = useState<GemPackage | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Gem size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Gem Packages</h2>
            <p className="text-sm text-zinc-500">Premium gem packages with purchasing power. {GEM_PACKAGES.length} packages available.</p>
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

      {viewMode === "compare" && <GemPackageComparison />}

      {selected ? (
        <GemPackageDetail pkg={selected} onClose={() => setSelected(null)} />
      ) : viewMode === "grid" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GEM_PACKAGES.map((pkg, i) => (
              <GemPackageCard
                key={pkg.label}
                pkg={pkg}
                index={i}
                onViewDetails={() => setSelected(pkg)}
                onCompare={() => { setSelected(null); setViewMode("compare"); }}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
            <h3 className="mb-4 text-sm font-bold text-zinc-300">Package Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Package</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Gems</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Price</th>
                    <th className="hidden pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">Per Gem</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Power</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {GEM_PACKAGES.map((pkg) => {
                    const premiumEligible = pkg.amount >= 100;
                    const licenseEligible = pkg.amount >= 50;
                    return (
                      <tr key={pkg.label} className="group hover:bg-zinc-800/30">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-blue-400" />
                            <span className="font-medium text-zinc-200">{pkg.label}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-zinc-300">{fmt(pkg.amount)}</td>
                        <td className="py-3 text-right font-medium text-zinc-200">{formatPrice(pkg.price, pkg.currency)}</td>
                        <td className="hidden py-3 text-right text-zinc-500 sm:table-cell">{(pkg.price / pkg.amount).toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            {premiumEligible && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                                <Crown size={8} /> P
                              </span>
                            )}
                            {licenseEligible && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                                <Shield size={8} /> L
                              </span>
                            )}
                            {!premiumEligible && !licenseEligible && (
                              <span className="text-[10px] text-zinc-600">—</span>
                            )}
                          </div>
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
