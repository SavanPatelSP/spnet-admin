"use client";

import { useState } from "react";
import { cn } from "@/lib/shared";
import { GEM_PACKAGES, type GemPackage } from "@/lib/constants";
import { GemPackageComparison } from "./GemPackageComparison";
import { Gem, Sparkles, Crown, Shield, Check, Package, ShoppingCart, Zap } from "lucide-react";

function fmt(n: number) { return n.toLocaleString(); }

const colorMap: Record<string, { text: string; border: string; bg: string; badge: string }> = {
  blue: { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", badge: "bg-blue-500/20 text-blue-300" },
  indigo: { text: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/10", badge: "bg-indigo-500/20 text-indigo-300" },
  purple: { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10", badge: "bg-purple-500/20 text-purple-300" },
  violet: { text: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/10", badge: "bg-violet-500/20 text-violet-300" },
};

const COLORS = ["blue", "indigo", "purple", "violet"];

const BENEFITS: Record<string, string[]> = {
  Starter: ["Quick engagement capabilities", "Entry-level reward system", "Basic premium purchasing power"],
  Growth: ["Standard reward operations", "License purchasing power unlocked", "Better value per gem"],
  Pro: ["Premium reward capacity", "Eligible for Premium subscriptions", "Professional-grade operations"],
  Enterprise: ["Maximum gem capacity", "Enterprise-scale rewards", "Full premium & license purchasing power", "Highest efficiency"],
};

function GemPackageCard({ pkg, index, onViewDetails }: { pkg: GemPackage; index: number; onViewDetails: () => void }) {
  const colorKey = COLORS[index % COLORS.length];
  const c = colorMap[colorKey] || colorMap.blue;
  const benefits = BENEFITS[pkg.label] || [];
  const premiumEligible = pkg.amount >= 100;
  const licenseEligible = pkg.amount >= 50;

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
              {fmt(pkg.amount)} Gems
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-lg font-bold", c.text)}>{pkg.currency}{pkg.price.toLocaleString()}</div>
          <div className="text-[10px] text-zinc-600">{(pkg.price / pkg.amount).toFixed(2)} per gem</div>
        </div>
      </div>

      {pkg.description && (
        <p className="mb-4 text-sm leading-relaxed text-zinc-500">{pkg.description}</p>
      )}

      <div className="mb-4 space-y-2">
        {benefits.slice(0, 3).map((b) => (
          <div key={b} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
            <span className="text-xs leading-relaxed text-zinc-400">{b}</span>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
          premiumEligible ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-800 text-zinc-500"
        )}>
          <Crown size={10} />
          Premium
        </div>
        <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
          licenseEligible ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
        )}>
          <Shield size={10} />
          License
        </div>
      </div>

      <button
        onClick={onViewDetails}
        className={cn("mt-auto rounded-xl py-2 text-xs font-medium transition-colors", c.bg, c.text, "hover:opacity-80")}
      >
        View Details
      </button>
    </div>
  );
}

function GemPackageDetail({ pkg, onClose }: { pkg: GemPackage; onClose: () => void }) {
  const benefits = BENEFITS[pkg.label] || [];
  const premiumEligible = pkg.amount >= 100;
  const licenseEligible = pkg.amount >= 50;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10">
          <Package size={28} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100">{pkg.label}</h2>
            <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-300">
              {fmt(pkg.amount)} Gems
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{pkg.description}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-200">
              {pkg.currency}{pkg.price.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500">
              {(pkg.price / pkg.amount).toFixed(2)} per gem
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

      <div className="grid grid-cols-2 gap-4">
        <div className={cn("rounded-2xl border p-5",
          premiumEligible ? "border-yellow-500/20 bg-yellow-500/5" : "border-zinc-800 bg-zinc-900/50"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Crown size={16} className={premiumEligible ? "text-yellow-400" : "text-zinc-500"} />
            <h3 className="text-sm font-semibold text-zinc-200">Premium Purchasing Power</h3>
          </div>
          {premiumEligible ? (
            <ul className="space-y-1.5">
              <li className="flex items-start gap-1.5 text-xs text-green-300">
                <Check size={12} className="mt-0.5 shrink-0 text-green-500" />
                Eligible for Premium subscription grants
              </li>
              <li className="flex items-start gap-1.5 text-xs text-green-300">
                <Check size={12} className="mt-0.5 shrink-0 text-green-500" />
                Can upgrade existing Premium plans
              </li>
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">Minimum 100 gems required for Premium purchasing power.</p>
          )}
        </div>

        <div className={cn("rounded-2xl border p-5",
          licenseEligible ? "border-blue-500/20 bg-blue-500/5" : "border-zinc-800 bg-zinc-900/50"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className={licenseEligible ? "text-blue-400" : "text-zinc-500"} />
            <h3 className="text-sm font-semibold text-zinc-200">License Purchasing Power</h3>
          </div>
          {licenseEligible ? (
            <ul className="space-y-1.5">
              <li className="flex items-start gap-1.5 text-xs text-blue-300">
                <Check size={12} className="mt-0.5 shrink-0 text-blue-500" />
                Eligible for License acquisition
              </li>
              <li className="flex items-start gap-1.5 text-xs text-blue-300">
                <Check size={12} className="mt-0.5 shrink-0 text-blue-500" />
                Can extend existing licenses
              </li>
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">Minimum 50 gems required for License purchasing power.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-bold text-zinc-300">Package Details</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div className="text-zinc-500">Package Name</div>
          <div className="font-medium text-zinc-200">{pkg.label}</div>
          <div className="text-zinc-500">Gem Amount</div>
          <div className="font-medium text-blue-400">{fmt(pkg.amount)}</div>
          <div className="text-zinc-500">Value</div>
          <div className="font-medium text-zinc-200">{pkg.currency}{pkg.price.toLocaleString()}</div>
          <div className="text-zinc-500">Unit Price</div>
          <div className="text-zinc-400">{(pkg.price / pkg.amount).toFixed(2)} per gem</div>
          <div className="text-zinc-500">Premium Eligible</div>
          <div className={premiumEligible ? "text-yellow-400" : "text-zinc-500"}>{premiumEligible ? "Yes (100+ gems)" : "No"}</div>
          <div className="text-zinc-500">License Eligible</div>
          <div className={licenseEligible ? "text-blue-400" : "text-zinc-500"}>{licenseEligible ? "Yes (50+ gems)" : "No"}</div>
          <div className="text-zinc-500">Package Position</div>
          <div className="text-zinc-400">Tier {GEM_PACKAGES.findIndex((p) => p.amount === pkg.amount) + 1} of {GEM_PACKAGES.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-bold text-zinc-300">Comparison</h3>
        <div className="space-y-3">
          {GEM_PACKAGES.map((other) => {
            if (other.amount === pkg.amount) return null;
            const ratio = other.amount / pkg.amount;
            const valueRatio = other.price / pkg.price;
            return (
              <div key={other.label} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-zinc-500" />
                  <span className="text-sm text-zinc-300">{other.label}</span>
                  <span className="text-xs text-zinc-500">({fmt(other.amount)} gems)</span>
                </div>
                <div className="flex items-center gap-2">
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
      <div className="flex items-center justify-between">
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
                        <td className="py-3 text-right font-medium text-zinc-200">{pkg.currency}{pkg.price.toLocaleString()}</td>
                        <td className="hidden py-3 text-right text-zinc-500 sm:table-cell">{(pkg.price / pkg.amount).toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
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
      )}
    </div>
  );
}
