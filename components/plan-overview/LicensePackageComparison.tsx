"use client";

import { useState, useMemo } from "react";
import { cn, formatPrice } from "@/lib/shared";
import { LICENSE_TIERS, type LicenseTier } from "@/lib/constants";
import {
  LICENSE_FEATURES_BY_CATEGORY,
  getLicenseCategories,
  getLicenseComparison,
} from "@/lib/plan-config";
import { KeyRound, Check, X, Search, Monitor, Calendar, Shield, ArrowUpRight, Users, Infinity, TrendingUp } from "lucide-react";

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

function TierSelect({ value, onChange, label }: {
  value: string; onChange: (v: string) => void; label: string;
}) {
  const tier = LICENSE_TIERS.find((t) => t.label === value);
  const c = getTierColor(tier || LICENSE_TIERS[0]);

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
          {LICENSE_TIERS.map((t) => (
            <option key={t.label} value={t.label}>
              {t.label} — {formatPrice(t.price, t.currency)}/mo · {t.maxDevices === -1 ? "Unlimited" : t.maxDevices} devices · {t.durationDays}d
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

function TierHeader({ tier }: { tier: LicenseTier }) {
  const c = getTierColor(tier);
  const perDevice = tier.maxDevices === -1 ? null : tier.price / tier.maxDevices;

  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-2xl border bg-zinc-900 p-5 text-center", c.border)}>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", c.bg)}>
        <KeyRound size={24} className={c.text} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-zinc-100">{tier.label}</h3>
        <span className={cn("mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", c.badge)}>
          Tier {LICENSE_TIERS.findIndex((t) => t.label === tier.label) + 1}
        </span>
      </div>
      <div>
        <span className="text-2xl font-bold text-zinc-100">{formatPrice(tier.price, tier.currency)}</span>
        <span className="ml-1 text-sm text-zinc-500">/mo</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Monitor size={12} />
          {tier.maxDevices === -1 ? "Unlimited" : tier.maxDevices} devices
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {tier.durationDays}d
        </span>
      </div>
      {perDevice !== null && (
        <div className="text-xs text-zinc-500">
          {formatPrice(perDevice, tier.currency)} per device / month
        </div>
      )}
      <p className="text-xs text-zinc-500">{tier.description}</p>
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
        <span className="text-zinc-500 sm:hidden">Tier A</span>
        {hasFirst ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-zinc-600" />}
      </div>
      <div className="flex items-center justify-between sm:justify-center">
        <span className="text-zinc-500 sm:hidden">Tier B</span>
        {hasSecond ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-zinc-600" />}
      </div>
    </div>
  );
}

export function LicensePackageComparison() {
  const [firstLabel, setFirstLabel] = useState(LICENSE_TIERS[0].label);
  const [secondLabel, setSecondLabel] = useState(LICENSE_TIERS[LICENSE_TIERS.length - 1].label);

  const first = LICENSE_TIERS.find((t) => t.label === firstLabel)!;
  const second = LICENSE_TIERS.find((t) => t.label === secondLabel)!;

  const features1 = LICENSE_FEATURES_BY_CATEGORY[first?.label || ""] || {};
  const features2 = LICENSE_FEATURES_BY_CATEGORY[second?.label || ""] || {};
  const allCategories = [...new Set([...getLicenseCategories(first?.label || ""), ...getLicenseCategories(second?.label || "")])];

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

  const deviceLabel = (t: LicenseTier) => t.maxDevices === -1 ? "Unlimited" : String(t.maxDevices);
  const deviceBetter = first.maxDevices === -1 ? 1 : second.maxDevices === -1 ? -1 : first.maxDevices > second.maxDevices ? 1 : first.maxDevices < second.maxDevices ? -1 : 0;

  const metricRows = [
    { label: "Price", first: `${formatPrice(first.price, first.currency)}/mo`, second: `${formatPrice(second.price, second.currency)}/mo`, better: first.price < second.price ? 1 : first.price > second.price ? -1 : 0 },
    { label: "Max Devices", first: deviceLabel(first), second: deviceLabel(second), better: deviceBetter },
    { label: "Duration", first: `${first.durationDays} days`, second: `${second.durationDays} days`, better: first.durationDays > second.durationDays ? 1 : first.durationDays < second.durationDays ? -1 : 0 },
    { label: "Organization Scope", first: first.organizationCompatibility, second: second.organizationCompatibility, better: 0 },
  ];

  const { added: allAdded } = getLicenseComparison(first.label, second.label);

  const deviceDiff = first.maxDevices === -1 || second.maxDevices === -1
    ? "unlimited capacity"
    : second.maxDevices >= first.maxDevices
    ? `${second.maxDevices - first.maxDevices} additional devices`
    : `${first.maxDevices - second.maxDevices} fewer devices`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TierSelect value={firstLabel} onChange={setFirstLabel} label="Tier A" />
        <TierSelect value={secondLabel} onChange={setSecondLabel} label="Tier B" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TierHeader tier={first} />
        <TierHeader tier={second} />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Specifications</h4>
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

      <div className="space-y-3">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Benefits</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h5 className="mb-2 text-xs font-semibold text-zinc-200">{first.label} Benefits</h5>
            <ul className="space-y-1.5">
              {first.benefits.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-xs text-zinc-400">
                  <Check size={12} className="mt-0.5 shrink-0 text-green-500" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h5 className="mb-2 text-xs font-semibold text-zinc-200">{second.label} Benefits</h5>
            <ul className="space-y-1.5">
              {second.benefits.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-xs text-zinc-400">
                  <Check size={12} className="mt-0.5 shrink-0 text-green-500" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-900/30 p-5">
        <h4 className="mb-3 text-sm font-bold text-zinc-300">Upgrade Path</h4>
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="font-medium text-zinc-200">{first.label}</span>
          <ArrowUpRight size={14} className="text-green-500" />
          <span className="text-zinc-500">
            {second.price > first.price
              ? `${formatPrice(second.price - first.price, second.currency)}/mo upgrade · ${deviceDiff}`
              : `${formatPrice(first.price - second.price, second.currency)}/mo savings · downgrade from ${first.label}`}
          </span>
          <span className="font-medium text-zinc-200">{second.label}</span>
        </div>
        {second.price > first.price && (
          <div className="mt-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 font-medium text-blue-400">
              <Shield size={10} /> {second.organizationCompatibility}
            </span>
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
