"use client";

import { useState } from "react";
import { cn, formatPrice } from "@/lib/shared";
import { LICENSE_TIERS, type LicenseTier } from "@/lib/constants";
import { LicensePackageComparison } from "./LicensePackageComparison";
import { KeyRound, Check, Monitor, Calendar, Shield, Users, Infinity, ArrowRight } from "lucide-react";

const colorMap: Record<string, { text: string; border: string; bg: string; badge: string }> = {
  green: { text: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/10", badge: "bg-green-500/20 text-green-300" },
  blue: { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", badge: "bg-blue-500/20 text-blue-300" },
  purple: { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10", badge: "bg-purple-500/20 text-purple-300" },
  amber: { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", badge: "bg-amber-500/20 text-amber-300" },
  red: { text: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10", badge: "bg-red-500/20 text-red-300" },
};

const COLORS = ["green", "blue", "purple", "amber", "red"];

function getTierColor(tier: LicenseTier) {
  const idx = LICENSE_TIERS.findIndex((t) => t.label === tier.label);
  const key = COLORS[idx >= 0 ? idx % COLORS.length : 0];
  return colorMap[key] || colorMap.green;
}

function LicenseTierCard({ tier, index, onViewDetails, onCompare }: { tier: LicenseTier; index: number; onViewDetails: () => void; onCompare: () => void }) {
  const c = getTierColor(tier);

  return (
    <div className={cn("group relative flex flex-col rounded-2xl border bg-zinc-900 p-6 transition-all duration-300 hover:-translate-y-0.5", c.border, "hover:shadow-lg")}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.bg)}>
            <KeyRound size={20} className={c.text} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">{tier.label}</h3>
            <span className={cn("mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", c.badge)}>
              Tier {index + 1}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-lg font-bold", c.text)}>{formatPrice(tier.price, tier.currency)}</div>
          <div className="text-[10px] text-zinc-600">/mo</div>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-zinc-500">{tier.description}</p>

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1">
          <Monitor size={10} />
          {tier.maxDevices === -1 ? "Unlimited" : tier.maxDevices} devices
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-1">
          <Calendar size={10} />
          {tier.durationDays}d
        </span>
      </div>

      <div className="mb-5 space-y-2">
        {tier.features.slice(0, 3).map((f) => (
          <div key={f} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
            <span className="text-xs leading-relaxed text-zinc-400">{f}</span>
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

function LicenseTierDetail({ tier, onClose }: { tier: LicenseTier; onClose: () => void }) {
  const c = getTierColor(tier);

  return (
    <div className="space-y-6">
      <div className={cn("flex items-start gap-4 rounded-2xl border p-5", c.border, c.bg)}>
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-xl", c.bg)}>
          <KeyRound size={28} className={c.text} />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100">{tier.label}</h2>
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", c.badge)}>
              Tier {LICENSE_TIERS.findIndex((t) => t.label === tier.label) + 1}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">{tier.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-zinc-200">
              {formatPrice(tier.price, tier.currency)}<span className="text-xs font-normal text-zinc-500">/mo</span>
            </span>
            <span className="text-xs text-zinc-500">
              <Monitor size={10} className="mr-1 inline" />
              {tier.maxDevices === -1 ? "Unlimited" : tier.maxDevices} devices
            </span>
            <span className="text-xs text-zinc-500">
              <Calendar size={10} className="mr-1 inline" />
              {tier.durationDays} days
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-3 text-sm font-bold text-zinc-300">Features</h3>
          <ul className="space-y-2">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-3 text-sm font-bold text-zinc-300">Benefits</h3>
          <ul className="space-y-2">
            {tier.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-zinc-400">
                <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
            <Users size={14} className="text-blue-400" />
            Organization Compatibility
          </div>
          <p className="text-sm text-zinc-300">{tier.organizationCompatibility}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
            <Monitor size={14} className="text-purple-400" />
            Usage Information
          </div>
          <p className="text-sm text-zinc-300">{tier.usageInfo}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
            <Calendar size={14} className="text-amber-400" />
            Expiration Information
          </div>
          <p className="text-sm text-zinc-300">{tier.expirationInfo}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-3 text-sm font-bold text-zinc-300">Value Summary</h3>
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Monthly Price</p>
            <p className="font-medium text-zinc-200">{formatPrice(tier.price, tier.currency)}/mo</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Yearly Price</p>
            <p className="font-medium text-zinc-200">{formatPrice(tier.price * 12, tier.currency)}/yr</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Per Device / Month</p>
            <p className="font-medium text-zinc-200">
              {tier.maxDevices === -1 ? "Unlimited" : formatPrice(tier.price / tier.maxDevices, tier.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Daily Cost</p>
            <p className="font-medium text-zinc-200">{formatPrice(tier.price / 30, tier.currency)}/day</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type ViewMode = "grid" | "compare";

export function LicensePackageOverview() {
  const [selected, setSelected] = useState<LicenseTier | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <KeyRound size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">License Packages</h2>
            <p className="text-sm text-zinc-500">Five license tiers from Starter to Ultimate. {LICENSE_TIERS.length} tiers available.</p>
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
            Compare Tiers
          </button>
        </div>
      </div>

      {viewMode === "compare" && <LicensePackageComparison />}

      {selected ? (
        <LicenseTierDetail tier={selected} onClose={() => setSelected(null)} />
      ) : viewMode === "grid" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {LICENSE_TIERS.map((tier, i) => (
              <LicenseTierCard
                key={tier.label}
                tier={tier}
                index={i}
                onViewDetails={() => setSelected(tier)}
                onCompare={() => { setSelected(null); setViewMode("compare"); }}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="mb-4 text-sm font-bold text-zinc-300">Tier Comparison</h3>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Tier</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Price</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Devices</th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">Duration</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Organization Scope</th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Best For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {LICENSE_TIERS.map((tier, i) => (
                    <tr key={tier.label} className="group hover:bg-zinc-800/30">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <KeyRound size={14} className="text-green-400" />
                          <span className="font-medium text-zinc-200">{tier.label}</span>
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">T{i + 1}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium text-zinc-200">{formatPrice(tier.price, tier.currency)}/mo</td>
                      <td className="py-3 text-right text-zinc-300">{tier.maxDevices === -1 ? "Unlimited" : tier.maxDevices}</td>
                      <td className="py-3 text-right text-zinc-300">{tier.durationDays}d</td>
                      <td className="py-3 text-zinc-400">{tier.organizationCompatibility}</td>
                      <td className="py-3 text-xs text-zinc-500">{tier.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 sm:hidden">
              {LICENSE_TIERS.map((tier, i) => (
                <div key={tier.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound size={14} className="text-green-400" />
                      <span className="font-medium text-zinc-200">{tier.label}</span>
                    </div>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">T{i + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500">Price:</span>{" "}
                      <span className="font-medium text-zinc-300">{formatPrice(tier.price, tier.currency)}/mo</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Devices:</span>{" "}
                      <span className="font-medium text-zinc-300">{tier.maxDevices === -1 ? "Unlimited" : tier.maxDevices}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Duration:</span>{" "}
                      <span className="font-medium text-zinc-300">{tier.durationDays}d</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Scope:</span>{" "}
                      <span className="font-medium text-zinc-300">{tier.organizationCompatibility}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">{tier.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
