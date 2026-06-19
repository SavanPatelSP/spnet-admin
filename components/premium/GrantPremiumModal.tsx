"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import {
  Search, Building2, Key, User, CheckCircle, X, Crown, Sparkles,
  ArrowRight, Calendar, Clock, TrendingUp, Shield, Star,
  BarChart3, Gem, Layers, Award, ArrowUpDown, ChevronRight,
} from "lucide-react";
import { ALL_PLANS, PLAN_META, PLAN_HIGHLIGHTS, PLAN_FEATURES_BY_CATEGORY, getPlanFeatureList, getPlanIndex, getPrevPlan, getPlanComparison } from "@/lib/premium";
import { PLAN_PRICES } from "@/lib/constants";
import { formatPrice } from "@/lib/shared";

interface LicenseOption {
  id: string;
  key: string;
  organization: string;
}

interface GrantPremiumModalProps {
  licenseId?: string;
  licenseOrg?: string;
  availableLicenses?: LicenseOption[];
  requests?: { licenseId: string; submittedBy: string; organization: string }[];
}

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

const DURATION_UNITS = ["days", "weeks", "months", "years"] as const;

function Badge({ label, color }: { label: string; color: string }) {
  const cls: Record<string, string> = {
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    red: "bg-red-500/15 text-red-400 border-red-500/25",
    green: "bg-green-500/15 text-green-400 border-green-500/25",
    zinc: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  };
  return (
    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${cls[color] || cls.zinc}`}>
      {label}
    </span>
  );
}

export default function GrantPremiumModal({
  licenseId: propLicenseId,
  licenseOrg,
  availableLicenses,
  requests,
}: GrantPremiumModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orgSearch, setOrgSearch] = useState("");
  const [licenseSearch, setLicenseSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [licenseId, setLicenseId] = useState(propLicenseId || "");
  const [plan, setPlan] = useState<string>("ENTERPRISE");
  const [subscriptionType, setSubscriptionType] = useState<string>("YEARLY");
  const [customDuration, setCustomDuration] = useState(1);
  const [customDurationUnit, setCustomDurationUnit] = useState<"days" | "weeks" | "months" | "years">("years");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notifyUser, setNotifyUser] = useState(true);
  const [notes, setNotes] = useState("");

  const isLifetime = subscriptionType === "LIFETIME";
  const isCustom = subscriptionType === "CUSTOM";

  const customDurationDays = useMemo(() => {
    switch (customDurationUnit) {
      case "days": return customDuration;
      case "weeks": return customDuration * 7;
      case "months": return customDuration * 30;
      case "years": return customDuration * 365;
    }
  }, [customDuration, customDurationUnit]);

  const computedEndDate = useMemo(() => {
    if (isLifetime) return null;
    const start = new Date(startDate);
    const end = new Date(start);
    if (isCustom) {
      end.setDate(end.getDate() + customDurationDays);
    } else {
      end.setDate(end.getDate() + (subscriptionType === "MONTHLY" ? 30 : 365));
    }
    return end;
  }, [startDate, customDurationDays, isLifetime, isCustom, subscriptionType]);

  const totalActiveDays = useMemo(() => {
    if (!computedEndDate) return null;
    return Math.round((computedEndDate.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  }, [computedEndDate, startDate]);

  const planPrice = PLAN_PRICES[plan] || 0;

  const planBorderMap: Record<string, string> = {
    PLUS: "border-blue-500/30 bg-blue-500/5 ring-blue-500/10",
    PRO: "border-purple-500/30 bg-purple-500/5 ring-purple-500/10",
    BUSINESS: "border-amber-500/30 bg-amber-500/5 ring-amber-500/10",
    ENTERPRISE: "border-red-500/30 bg-red-500/5 ring-red-500/10",
    STUDENT: "border-green-500/30 bg-green-500/5 ring-green-500/10",
  };

  const computedBilling = useMemo(() => {
    if (planPrice === 0) return { total: 0, perMonth: 0, label: "Free", short: "$0" };
    const perMonth = planPrice;
    if (isLifetime) {
      const total = planPrice * 120;
      return { total, perMonth, label: `${formatPrice(total, "$")} (10-yr equivalent)`, short: formatPrice(total, "$") };
    }
    if (isCustom && customDurationDays > 0) {
      const total = (perMonth / 30) * customDurationDays;
      return { total, perMonth, label: `${formatPrice(total, "$")} for ${customDuration} ${customDurationUnit}`, short: formatPrice(total, "$") };
    }
    if (subscriptionType === "YEARLY") {
      const total = perMonth * 12;
      return { total, perMonth, label: `${formatPrice(total, "$")}/yr`, short: `${formatPrice(total, "$")}/yr` };
    }
    return { total: perMonth, perMonth, label: `${formatPrice(perMonth, "$")}/mo`, short: `${formatPrice(perMonth, "$")}/mo` };
  }, [planPrice, subscriptionType, isCustom, isLifetime, customDuration, customDurationUnit, customDurationDays]);

  const filteredLicenses = useMemo(() => {
    if (!availableLicenses) return [];
    const oq = orgSearch.toLowerCase();
    const lq = licenseSearch.toLowerCase();
    const uq = userSearch.toLowerCase();
    return availableLicenses.filter((l) => {
      const orgMatch = !oq || l.organization.toLowerCase().includes(oq);
      const keyMatch = !lq || l.key.toLowerCase().includes(lq);
      const request = requests?.find((r) => r.licenseId === l.id);
      const submitterName = request?.submittedBy?.toLowerCase() || "";
      const userMatch = !uq || l.organization.toLowerCase().includes(uq) || submitterName.includes(uq);
      return orgMatch && keyMatch && userMatch;
    });
  }, [availableLicenses, orgSearch, licenseSearch, userSearch, requests]);

  const selectedLicense = availableLicenses?.find((l) => l.id === licenseId);
  const selectedRequest = requests?.find((r) => r.licenseId === licenseId);
  const hasAnySearch = orgSearch || licenseSearch || userSearch;
  const needsSelection = !propLicenseId && !licenseId;

  const selectedFeatures = PLAN_FEATURES_BY_CATEGORY[plan as keyof typeof PLAN_FEATURES_BY_CATEGORY] || {};
  const selectedFeatureList = getPlanFeatureList(plan);
  const freeFeatureList = getPlanFeatureList("FREE");
  const planHighlights = PLAN_HIGHLIGHTS[plan] || [];

  const gainedFeatures = useMemo(
    () => selectedFeatureList.filter((f) => !freeFeatureList.includes(f)),
    [selectedFeatureList, freeFeatureList]
  );

  const planMeta = PLAN_META[plan];

  const prev = getPrevPlan(plan);
  const prevFeatures = prev ? getPlanFeatureList(prev) : [];
  const newInThisTier = prev
    ? selectedFeatureList.filter((f) => !prevFeatures.includes(f))
    : selectedFeatureList;

  function resetSelection() {
    setLicenseId("");
    setOrgSearch("");
    setLicenseSearch("");
    setUserSearch("");
  }

  function clearSearchs() {
    setOrgSearch("");
    setLicenseSearch("");
    setUserSearch("");
  }

  async function handleGrant() {
    setError("");
    const targetId = propLicenseId || licenseId;
    if (!targetId) { setError("Please search and select a license"); return; }
    if (!isLifetime && !isCustom && subscriptionType === "YEARLY" ? 365 < 1 : customDurationDays < 1) {
      setError("Duration must be at least 1 day");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        licenseId: targetId, plan, subscriptionType, startDate,
        notes: [notes, notifyUser ? "Notify user requested" : ""].filter(Boolean).join(" | ") || null,
      };
      if (isCustom) {
        body.customDuration = customDuration;
        body.customDurationUnit = customDurationUnit;
        body.customDurationDays = customDurationDays;
      } else if (!isLifetime) {
        body.durationDays = subscriptionType === "MONTHLY" ? 30 : 365;
      }
      const res = await fetch(API_ROUTES.PREMIUM.GRANT, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to grant premium"); return; }
      setOpen(false);
      resetSelection();
      setPlan("ENTERPRISE");
      setSubscriptionType("YEARLY");
      setCustomDuration(1);
      setCustomDurationUnit("years");
      setStartDate(new Date().toISOString().split("T")[0]);
      setNotifyUser(true);
      setNotes("");
      router.refresh();
    } catch { setError("Failed to grant premium"); }
    finally { setLoading(false); }
  }

  return (
    <>
      {propLicenseId ? (
        <ActionButton onClick={() => setOpen(true)} variant="primary" size="sm">
          <Crown size={14} /> Grant Premium
        </ActionButton>
      ) : (
        <ActionButton onClick={() => setOpen(true)} variant="primary" size="lg">
          <Crown size={16} /> Grant Premium
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); resetSelection(); }}
        title="Grant Premium"
        description={licenseOrg ? `Provision a premium subscription for ${licenseOrg}.` : "Provision a premium subscription."}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => { setOpen(false); resetSelection(); }}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleGrant} disabled={loading || needsSelection}>
              {loading ? "Granting..." : "Grant Premium"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* ── Step 1: Select License ── */}
          {!propLicenseId && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
                <h4 className="text-sm font-semibold text-zinc-100">Select License</h4>
              </div>
              <div className="space-y-2.5">
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input type="text" placeholder="Search by organization..." value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
                </div>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input type="text" placeholder="Search by license key..." value={licenseSearch}
                    onChange={(e) => setLicenseSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
                </div>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input type="text" placeholder="Search by submitter..." value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
                </div>
              </div>

              {hasAnySearch && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-zinc-800">
                  {filteredLicenses.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 p-6 text-sm text-zinc-500">
                      <Search size={14} /> No licenses match your search criteria
                    </div>
                  ) : (
                    filteredLicenses.map((l) => {
                      const request = requests?.find((r) => r.licenseId === l.id);
                      return (
                        <button key={l.id} type="button"
                          onClick={() => { setLicenseId(l.id); setOrgSearch(l.organization); }}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-800 ${
                            licenseId === l.id ? "bg-blue-500/10 ring-1 ring-inset ring-blue-500/30" : ""
                          }`}>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            licenseId === l.id ? "border-blue-500 bg-blue-500" : "border-zinc-600"
                          }`}>
                            {licenseId === l.id && <CheckCircle size={12} className="text-white" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-200">{l.organization}</span>
                              <code className="text-xs text-zinc-500">{l.key}</code>
                            </div>
                            {request?.submittedBy && (
                              <div className="mt-0.5 text-xs text-zinc-500">Requested by: {request.submittedBy}</div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {!hasAnySearch && (
                <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-zinc-800 p-6">
                  <Search size={16} className="mr-2 text-zinc-600" />
                  <span className="text-sm text-zinc-600">Use the search fields above to find a license</span>
                </div>
              )}
            </div>
          )}

          {/* Selected License Summary */}
          {selectedLicense && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{selectedLicense.organization}</p>
                    <code className="text-xs text-zinc-500">{selectedLicense.key}</code>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedRequest?.submittedBy && (
                    <span className="text-xs text-zinc-500">Requested: {selectedRequest.submittedBy}</span>
                  )}
                  <button type="button" onClick={clearSearchs} className="text-zinc-500 hover:text-zinc-300">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Plan Selection ── */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Select Plan</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {ALL_PLANS.map((p) => {
                const meta = PLAN_META[p];
                const catFeatures = PLAN_FEATURES_BY_CATEGORY[p] || {};
                const totalFeatures = Object.values(catFeatures).flat().length;
                const catCount = Object.keys(catFeatures).length;
                const price = PLAN_PRICES[p];
                const isSelected = plan === p;
                const Icon = meta.icon;
                const highlights = PLAN_HIGHLIGHTS[p] || [];

                const selectedStyles: Record<string, string> = {
                  zinc: "border-zinc-500/50 bg-zinc-500/10 shadow-zinc-500/10",
                  green: "border-green-500/50 bg-green-500/10 shadow-green-500/10",
                  blue: "border-blue-500/50 bg-blue-500/10 shadow-blue-500/10",
                  purple: "border-purple-500/50 bg-purple-500/10 shadow-purple-500/10",
                  amber: "border-amber-500/50 bg-amber-500/10 shadow-amber-500/10",
                  red: "border-red-500/50 bg-red-500/10 shadow-red-500/10",
                };
                return (
                  <button key={p} type="button" onClick={() => setPlan(p)}
                    className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                      isSelected
                        ? `${selectedStyles[meta.color] || selectedStyles.zinc} shadow-lg scale-[1.02]`
                        : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30 ring-2 ring-zinc-900">
                        <CheckCircle size={14} className="text-white" />
                      </span>
                    )}
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={
                            p === "PLUS" ? "text-blue-400" : p === "PRO" ? "text-purple-400" :
                            p === "BUSINESS" ? "text-amber-400" : p === "ENTERPRISE" ? "text-red-400" :
                            p === "STUDENT" ? "text-green-400" :
                            "text-zinc-500"
                          } />
                          <span className="font-semibold text-zinc-100">{p}</span>
                          {meta.badge && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                              p === "PLUS" ? "bg-blue-500/15 text-blue-300 border-blue-500/25" :
                              p === "PRO" ? "bg-purple-500/15 text-purple-300 border-purple-500/25" :
                              p === "BUSINESS" ? "bg-amber-500/15 text-amber-300 border-amber-500/25" :
                              p === "STUDENT" ? "bg-green-500/15 text-green-300 border-green-500/25" :
                              p === "ENTERPRISE" ? "bg-red-500/15 text-red-300 border-red-500/25" :
                              "bg-zinc-500/15 text-zinc-300 border-zinc-500/25"
                            }`}>
                              {meta.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500">{meta.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-zinc-100">{price === 0 ? "Free" : formatPrice(price, "$")}</div>
                        {price > 0 && <div className="text-[10px] text-zinc-500">/mo</div>}
                      </div>
                    </div>

                    {/* Upgrade delta */}
                    {p !== "FREE" && prev && (
                      <div className="mt-1 flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-[9px] text-green-400">
                        <ArrowUpDown size={8} />
                        {newInThisTier.length} new features at this tier
                      </div>
                    )}

                    {/* Highlights — the compelling benefit bullets */}
                    <div className="mt-3 space-y-1.5">
                      {highlights.slice(0, 6).map((h) => (
                        <div key={h} className="flex items-start gap-2 text-[12px] leading-snug text-zinc-300">
                          <CheckCircle size={10} className="mt-0.5 shrink-0 text-green-500" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Feature categories summary */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Object.entries(catFeatures).map(([cat, feats]) => (
                        <div key={cat} className="flex items-center gap-1.5 rounded-md bg-zinc-800/30 px-2 py-1 text-[10px] text-zinc-400">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${
                            p === "PLUS" ? "bg-blue-400" : p === "PRO" ? "bg-purple-400" :
                            p === "BUSINESS" ? "bg-amber-400" : p === "ENTERPRISE" ? "bg-red-400" :
                            p === "STUDENT" ? "bg-green-400" : "bg-zinc-500"
                          }`} />
                          <span className="truncate flex-1">{cat}</span>
                          <span className="rounded bg-zinc-800 px-1 text-[9px] font-medium text-zinc-500">{feats.length}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer stats */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-700/40 flex items-center gap-3 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1"><CheckCircle size={8} className="text-zinc-600" /> {totalFeatures} features</span>
                      <span className="flex items-center gap-1"><Layers size={8} className="text-zinc-600" /> {catCount} categories</span>
                      {price > 0 && <span className={`flex items-center gap-1 ml-auto font-medium ${isSelected ? "text-green-400" : "text-zinc-400"}`}>{formatPrice(price, "$")}/mo</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            {plan && (
              <div className={`rounded-xl border p-5 mt-4 ring-1 ring-inset transition-all ${
                planBorderMap[plan] || "border-zinc-700/80 bg-zinc-800/60 ring-zinc-600/30"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold uppercase tracking-wider ${
                      plan === "PLUS" ? "text-blue-300" : plan === "PRO" ? "text-purple-300" :
                      plan === "BUSINESS" ? "text-amber-300" : plan === "ENTERPRISE" ? "text-red-300" :
                      plan === "STUDENT" ? "text-green-300" : "text-zinc-200"
                    }`}>
                      Full Feature Breakdown &mdash; {plan}
                    </span>
                    <Badge label={`${Object.keys(selectedFeatures).length} categories`} color={planMeta?.color || "zinc"} />
                  </div>
                  <div className={`hidden sm:flex items-center gap-1 text-[10px] ${
                    plan === "PLUS" ? "text-blue-400" : plan === "PRO" ? "text-purple-400" :
                    plan === "BUSINESS" ? "text-amber-400" : plan === "ENTERPRISE" ? "text-red-400" :
                    plan === "STUDENT" ? "text-green-400" : "text-zinc-400"
                  }`}>
                    <CheckCircle size={8} />
                    {selectedFeatureList.length} total features
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(selectedFeatures).map(([cat, feats]) => (
                    <div key={cat} className={`rounded-lg border p-3 ${
                      plan === "PLUS" ? "border-blue-500/15 bg-blue-500/[0.04]" :
                      plan === "PRO" ? "border-purple-500/15 bg-purple-500/[0.04]" :
                      plan === "BUSINESS" ? "border-amber-500/15 bg-amber-500/[0.04]" :
                      plan === "ENTERPRISE" ? "border-red-500/15 bg-red-500/[0.04]" :
                      plan === "STUDENT" ? "border-green-500/15 bg-green-500/[0.04]" :
                      "border-zinc-700/50 bg-zinc-800/30"
                    }`}>
                      <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-zinc-700/30">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          plan === "PLUS" ? "bg-blue-400" : plan === "PRO" ? "bg-purple-400" :
                          plan === "BUSINESS" ? "bg-amber-400" : plan === "ENTERPRISE" ? "bg-red-400" :
                          plan === "STUDENT" ? "bg-green-400" : plan === "BASIC" ? "bg-zinc-400" : "bg-zinc-500"
                        }`} />
                        <span className="text-sm font-semibold text-zinc-200">{cat}</span>
                        <span className="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500">{feats.length}</span>
                      </div>
                      <ul className="space-y-1">
                        {feats.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[12px] leading-snug text-zinc-400">
                            <CheckCircle size={8} className="mt-0.5 shrink-0 text-green-500" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Step 3: Configure Subscription ── */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Configure Subscription</h4>
            </div>

            {/* ── Section A: Current Status ── */}
            <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-700 text-[9px] font-bold text-zinc-300">A</div>
                <span className="text-xs font-semibold text-zinc-300">Current Status</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2 text-xs">
                <span className="text-zinc-500">Current Plan</span>
                <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
                  <Star size={12} className="text-zinc-500" />
                  FREE
                </span>
                <span className="text-zinc-500">Expiration</span>
                <span className="text-zinc-400">N/A (no active subscription)</span>
                <span className="text-zinc-500">Benefits</span>
                <span className="text-zinc-400">{freeFeatureList.length} features across {Object.keys(PLAN_FEATURES_BY_CATEGORY["FREE"] || {}).length} categories</span>
              </div>
            </div>

            {/* ── Section B: Selected Plan ── */}
            {plan && (
              <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/20 text-[9px] font-bold text-blue-400">B</div>
                  <span className="text-xs font-semibold text-blue-300">Selected Plan</span>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-100">{plan}</span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{subscriptionType}</span>
                    {planMeta?.badge && <Badge label={planMeta.badge} color={planMeta.color} />}
                  </div>
                  <span className="text-xs font-medium text-green-400 bg-green-500/10 rounded-full px-2 py-0.5">
                    {computedBilling.short}
                  </span>
                </div>

                {/* Upgrade path */}
                <div className="mt-3 flex items-center gap-1.5 text-[10px]">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">FREE</span>
                  <ChevronRight size={10} className="text-zinc-600" />
                  <span className={`rounded px-1.5 py-0.5 font-medium ${
                    plan === "PLUS" ? "bg-blue-500/10 text-blue-400" :
                    plan === "PRO" ? "bg-purple-500/10 text-purple-400" :
                    plan === "BUSINESS" ? "bg-amber-500/10 text-amber-400" :
                    plan === "ENTERPRISE" ? "bg-red-500/10 text-red-400" :
                    plan === "STUDENT" ? "bg-green-500/10 text-green-400" :
                    "bg-zinc-700 text-zinc-300"
                  }`}>{plan}</span>
                  <span className="text-zinc-600">&middot;</span>
                  <span className="text-green-400">+{gainedFeatures.length} features gained</span>
                </div>

                {/* New benefits preview */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {planHighlights.slice(0, 4).map((h) => (
                    <span key={h} className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] text-green-400">
                      <CheckCircle size={6} /> {h}
                    </span>
                  ))}
                  {planHighlights.length > 4 && (
                    <span className="text-[9px] text-zinc-600">+{planHighlights.length - 4} more</span>
                  )}
                </div>
              </div>
            )}

            {/* ── Section C: Subscription Configuration ── */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-700 text-[9px] font-bold text-zinc-300">C</div>
                <span className="text-xs font-semibold text-zinc-300">Subscription Configuration</span>
              </div>

              <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Layers size={12} />
                    Duration Type
                  </label>
                  <select value={subscriptionType} onChange={(e) => setSubscriptionType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500">
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                    <option value="CUSTOM">CUSTOM</option>
                    <option value="LIFETIME">LIFETIME</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Crown size={12} />
                    Duration Value
                  </label>
                  <div className="flex h-[42px] items-center rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-300">
                    <Clock size={14} className="mr-2 text-zinc-500" />
                    {isLifetime ? "Permanent" : isCustom ? `${customDuration} ${customDurationUnit}` : subscriptionType === "MONTHLY" ? "30 days" : "365 days"}
                  </div>
                </div>
              </div>

              {isLifetime ? (
                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300">
                  <Crown size={12} className="mr-1.5 inline" />
                  Lifetime subscription &mdash; no expiration. The user will have permanent access to {plan} features.
                </div>
              ) : isCustom ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                        <Clock size={12} />
                        Duration
                      </label>
                      <input type="number" min="1" max="36500"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Unit</label>
                      <div className="flex gap-2">
                        {DURATION_UNITS.map((unit) => (
                          <button key={unit} type="button"
                            onClick={() => setCustomDurationUnit(unit)}
                            className={`flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                              customDurationUnit === unit
                                ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                                : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                            }`}>
                            {unit}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                        <Calendar size={12} />
                        Start Date
                      </label>
                      <input type="date" value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Expiration Date</label>
                      <div className="flex h-[42px] items-center rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-300">
                        {computedEndDate ? (
                          <span className="font-medium text-blue-400">{fmt(computedEndDate)}</span>
                        ) : <span className="text-zinc-600">Auto-computed</span>}
                      </div>
                    </div>
                  </div>

                  {/* Live duration flow */}
                  {computedEndDate && totalActiveDays !== null && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-3">
                        <TrendingUp size={10} />
                        Duration Flow
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-zinc-200 font-medium">{fmt(new Date(startDate))}</span>
                        <ArrowRight size={10} className="shrink-0 text-zinc-500" />
                        <span className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-blue-300 font-medium">{customDuration} {customDurationUnit}</span>
                        <ArrowRight size={10} className="shrink-0 text-zinc-500" />
                        <span className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-blue-400 font-medium">{fmt(computedEndDate)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-blue-200/60">
                        <Clock size={8} />
                        Total active time: <strong className="text-blue-300">{totalActiveDays.toLocaleString()} days</strong>
                        <span className="text-zinc-500">({customDurationDays.toLocaleString()} calendar days)</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                        <Calendar size={12} />
                        Start Date
                      </label>
                      <input type="date" value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">Expiration Date</label>
                      <div className="flex h-[42px] items-center rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-300">
                        {computedEndDate ? (
                          <span className="font-medium text-blue-400">{fmt(computedEndDate)}</span>
                        ) : <span className="text-zinc-600">Auto-computed</span>}
                      </div>
                    </div>
                  </div>

                  {/* Live duration flow */}
                  {computedEndDate && totalActiveDays !== null && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-3">
                        <TrendingUp size={10} />
                        Duration Flow
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-zinc-200 font-medium">{fmt(new Date(startDate))}</span>
                        <ArrowRight size={10} className="shrink-0 text-zinc-500" />
                        <span className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-zinc-300">{subscriptionType === "MONTHLY" ? "30 days" : "365 days"}</span>
                        <ArrowRight size={10} className="shrink-0 text-zinc-500" />
                        <span className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-blue-400 font-medium">{fmt(computedEndDate)}</span>
                      </div>
                      <div className="mt-2 text-[10px] text-blue-200/60">
                        <Clock size={8} className="mr-1 inline" />
                        Total active time: <strong className="text-blue-300">{totalActiveDays.toLocaleString()} days</strong>
                        <span className="text-zinc-500"> ({subscriptionType === "MONTHLY" ? "30" : "365"} calendar days)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Step 4: Impact Analysis ── */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">4</span>
              <h4 className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-green-300">
                <TrendingUp size={14} />
                Impact Analysis
              </h4>
            </div>

            {/* Before / After comparison */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
              {/* Before */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-zinc-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Before</span>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Star size={16} className="text-zinc-500" />
                  <span className="text-sm font-bold text-zinc-300">FREE</span>
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Price</span>
                    <span className="text-zinc-400">$0/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Features</span>
                    <span className="text-zinc-400">{freeFeatureList.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Categories</span>
                    <span className="text-zinc-400">{Object.keys(PLAN_FEATURES_BY_CATEGORY["FREE"] || {}).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Support</span>
                    <span className="text-zinc-400">Community</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Status</span>
                    <span className="text-amber-400">Basic</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="rounded-full bg-green-500/20 p-2">
                    <ArrowRight size={20} className="text-green-400" />
                  </div>
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-semibold text-green-400">Upgrade</span>
                  <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[8px] text-zinc-500">{plan}</span>
                </div>
              </div>

              {/* After */}
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 sm:p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">After</span>
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Crown size={16} className={
                    plan === "PLUS" ? "text-blue-400" : plan === "PRO" ? "text-purple-400" :
                    plan === "BUSINESS" ? "text-amber-400" : plan === "ENTERPRISE" ? "text-red-400" :
                    plan === "STUDENT" ? "text-green-400" : "text-red-400"
                  } />
                  <span className="text-sm font-bold text-zinc-100">{plan}</span>
                  <span className="rounded-full border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">{subscriptionType}</span>
                  {planMeta?.badge && <Badge label={planMeta.badge} color={planMeta.color} />}
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Price</span>
                    <span className="text-green-400 font-medium">{computedBilling.short}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Features</span>
                    <span className="text-green-400">{selectedFeatureList.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Categories</span>
                    <span className="text-green-400">{Object.keys(selectedFeatures).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Support</span>
                    <span className={
                      plan === "ENTERPRISE" ? "text-purple-400" :
                      plan === "BUSINESS" ? "text-amber-400" :
                      plan === "PRO" ? "text-purple-300" :
                      "text-green-300"
                    }>
                      {plan === "ENTERPRISE" ? "24/7 Dedicated + AM" :
                       plan === "BUSINESS" ? "Dedicated + SLA" :
                       plan === "PRO" ? "Priority" :
                       plan === "STUDENT" ? "Priority" :
                       "Standard"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Status</span>
                    <span className="text-green-400">Premium</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits analysis */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-green-500/10 bg-green-500/5 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-green-400">
                  <Sparkles size={11} />
                  New Benefits &mdash; {plan}
                </div>
                <div className="space-y-1">
                  {planHighlights.filter((h) => !h.startsWith("Everything")).slice(0, 6).map((h) => (
                    <div key={h} className="flex items-start gap-1.5 text-[11px] text-green-200/70 leading-tight">
                      <CheckCircle size={7} className="mt-0.5 shrink-0 text-green-500" />
                      {h}
                    </div>
                  ))}
                  {gainedFeatures.length > 0 && (
                    <div className="text-[10px] text-zinc-600 pt-1">
                      + {gainedFeatures.length} additional feature upgrades
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                  <Award size={11} />
                  Upgrade Summary
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <CheckCircle size={7} className="shrink-0 text-blue-500" />
                    <span className="text-green-300">+{gainedFeatures.length}</span> new features gained
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <CheckCircle size={7} className="shrink-0 text-blue-500" />
                    FREE <ChevronRight size={8} className="text-zinc-600" /> <span className="text-zinc-200">{plan}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <CheckCircle size={7} className="shrink-0 text-blue-500" />
                    <span className={plan === "ENTERPRISE" ? "text-red-400" : plan === "BUSINESS" ? "text-amber-400" : plan === "PRO" ? "text-purple-400" : "text-blue-400"}>
                      {Object.keys(selectedFeatures).length}
                    </span> feature categories
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <CheckCircle size={7} className="shrink-0 text-blue-500" />
                    <span className="text-zinc-200">{subscriptionType}</span> subscription
                  </div>
                  {computedEndDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <CheckCircle size={7} className="shrink-0 text-blue-500" />
                      Active until <span className="text-blue-400">{fmt(computedEndDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <CheckCircle size={7} className="shrink-0 text-blue-500" />
                    Billing: <span className="text-green-400">{computedBilling.short}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Comparison: FREE vs Selected */}
            <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-2">
                <BarChart3 size={10} />
                Detailed Comparison: FREE vs {plan}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-2 text-[10px]">
                <div className="font-medium text-zinc-500">Metric</div>
                <div className="font-medium text-zinc-500 text-center">FREE</div>
                <div className="font-medium text-zinc-500 text-center">{plan}</div>

                <div className="text-zinc-300">Feature Count</div>
                <div className="text-center text-zinc-400">{freeFeatureList.length}</div>
                <div className="text-center text-green-400">{selectedFeatureList.length}</div>

                <div className="text-zinc-300">Categories</div>
                <div className="text-center text-zinc-400">{Object.keys(PLAN_FEATURES_BY_CATEGORY["FREE"] || {}).length}</div>
                <div className="text-center text-green-400">{Object.keys(selectedFeatures).length}</div>

                {["Messaging","Storage","Media","Administration","Support","Security","Licensing Benefits","Business Tools"].map((cat) => {
                  const freeCount = PLAN_FEATURES_BY_CATEGORY["FREE"]?.[cat]?.length ?? null;
                  const planCount = selectedFeatures?.[cat]?.length ?? null;
                  return (
                    <React.Fragment key={cat}>
                      <div className="text-zinc-300">{cat === "Licensing Benefits" ? "License Benefits" : cat}</div>
                      <div className="text-center">{freeCount !== null ? <span className="text-zinc-400">{freeCount} feature{freeCount !== 1 ? "s" : ""}</span> : <span className="text-zinc-600">&mdash;</span>}</div>
                      <div className="text-center">{planCount !== null ? <span className="text-green-400">{planCount} feature{planCount !== 1 ? "s" : ""}</span> : <span className="text-zinc-600">&mdash;</span>}</div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Tier inheritance visualization */}
            {prev && prev !== "FREE" && (
              <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-2">
                  <Shield size={10} />
                  Tier Inheritance
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">FREE</span>
                  <ChevronRight size={8} className="text-zinc-600" />
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">{prev}</span>
                  <ChevronRight size={8} className="text-zinc-600" />
                  <span className={`rounded px-1.5 py-0.5 font-medium ${
                    plan === "PLUS" ? "bg-blue-500/10 text-blue-400" :
                    plan === "PRO" ? "bg-purple-500/10 text-purple-400" :
                    plan === "BUSINESS" ? "bg-amber-500/10 text-amber-400" :
                    plan === "ENTERPRISE" ? "bg-red-500/10 text-red-400" :
                    plan === "STUDENT" ? "bg-green-500/10 text-green-400" :
                    "bg-zinc-700 text-zinc-300"
                  }`}>{plan}</span>
                </div>
                <div className="mt-1.5 text-[10px] text-zinc-500">
                  Everything in {prev} is included + {newInThisTier.length} new features at this tier
                </div>
              </div>
            )}

            {/* Expiration Change */}
            {computedEndDate && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                  <Calendar size={11} />
                  Expiration Change
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-500">N/A (FREE)</span>
                  <ArrowRight size={10} className="shrink-0 text-zinc-500" />
                  <span className="rounded bg-zinc-800 px-2 py-1 text-blue-400 font-medium">{fmt(computedEndDate)}</span>
                </div>
                <div className="mt-1.5 text-[10px] text-zinc-500">
                  {totalActiveDays !== null ? `${totalActiveDays.toLocaleString()} days` : ""}
                  {subscriptionType === "YEARLY" && " (Annual)"}
                  {subscriptionType === "MONTHLY" && " (Monthly)"}
                  {isCustom && ` (${customDuration} ${customDurationUnit})`}
                </div>
              </div>
            )}
          </div>

          {/* ── Step 5: Notes & Notification ── */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">5</span>
              <h4 className="text-sm font-semibold text-zinc-100">Notes &amp; Notification</h4>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Notes (optional)</label>
              <textarea placeholder="Reason for granting premium..." value={notes}
                onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)} className="peer sr-only" />
                <div className="h-5 w-9 rounded-full bg-zinc-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-zinc-400 after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
              </label>
              <span className="text-xs text-zinc-400">Notify user about this grant</span>
            </div>
          </div>

          {/* ── Premium Value Summary ── */}
          {selectedLicense && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">
                  <CheckCircle size={12} />
                </span>
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                  <Gem size={14} />
                  Premium Value Summary
                </h4>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Selected Plan</span>
                      <span className="flex items-center gap-1 font-medium text-zinc-100">
                        <Crown size={12} className={
                          plan === "PLUS" ? "text-blue-400" : plan === "PRO" ? "text-purple-400" :
                          plan === "BUSINESS" ? "text-amber-400" : plan === "ENTERPRISE" ? "text-red-400" :
                          plan === "STUDENT" ? "text-green-400" : "text-zinc-400"
                        } />
                        {plan}
                        {planMeta?.badge && <Badge label={planMeta.badge} color={planMeta.color} />}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Duration</span>
                      <span className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                        {isLifetime ? "Lifetime" : isCustom
                          ? `${customDuration} ${customDurationUnit}`
                          : subscriptionType === "MONTHLY" ? "30 days" : "365 days"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Billing Value</span>
                      <span className="font-medium text-green-400">{computedBilling.short}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Type</span>
                      <span className="text-zinc-300">{subscriptionType}</span>
                    </div>
                    {computedEndDate && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Expires</span>
                        <span className="text-blue-400">{fmt(computedEndDate)}</span>
                      </div>
                    )}
                    {isLifetime && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Expires</span>
                        <span className="text-purple-400 font-medium">Never (Lifetime)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
                  <div className="mb-2 text-[11px] font-medium text-zinc-400">Benefits Included</div>
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[9px] text-green-400">
                      {selectedFeatureList.length} features
                    </span>
                    <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] text-blue-400">
                      {Object.keys(selectedFeatures).length} categories
                    </span>
                    <span className="rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[9px] text-purple-400">Premium</span>
                    {notifyUser && (
                      <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-400">Notify</span>
                    )}
                    {planMeta?.badge && <Badge label={planMeta.badge} color={planMeta.color} />}
                  </div>

                  <div className="mt-2 space-y-1">
                    {Object.entries(selectedFeatures).slice(0, 4).map(([cat, features]) => (
                      <div key={cat} className="text-[10px] text-zinc-500 flex items-center justify-between">
                        <span className="font-medium text-zinc-400">{cat}</span>
                        <span className="text-zinc-600">{features.length} items</span>
                      </div>
                    ))}
                    {Object.keys(selectedFeatures).length > 4 && (
                      <div className="text-[10px] text-zinc-600">+{Object.keys(selectedFeatures).length - 4} more categories</div>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-700/50">
                    <div className="flex items-center gap-1 text-[11px]">
                      <CheckCircle size={9} className="text-green-500" />
                      <span className="text-green-400 font-medium">Premium Result: Active</span>
                    </div>
                    <div className="text-[9px] text-zinc-600 mt-0.5">
                      {plan} &middot; {subscriptionType} &middot; {computedEndDate ? `until ${fmt(computedEndDate)}` : "Lifetime"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Audit Preview ── */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4 overflow-x-auto">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex">
                <span className="w-28 text-zinc-500">Action</span>
                <span className="text-yellow-400">PREMIUM_GRANTED</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Admin</span>
                <span className="text-zinc-300">Current session</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Target User</span>
                <span className="text-zinc-300">{selectedLicense?.organization || licenseOrg || "\u2014"}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">License</span>
                <span className="text-zinc-300">{propLicenseId || licenseId || "\u2014"}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Current Plan</span>
                <span className="text-zinc-300">FREE</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">New Plan</span>
                <span className="text-green-400">{plan}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Duration</span>
                <span className="text-zinc-300">
                  {isLifetime ? "Lifetime" : isCustom
                    ? `${customDuration} ${customDurationUnit}`
                    : subscriptionType === "MONTHLY" ? "30 days" : "365 days"}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Expiration</span>
                <span className={computedEndDate ? "text-blue-400" : "text-purple-400"}>
                  {computedEndDate ? fmt(computedEndDate) : "Never (Lifetime)"}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Billing</span>
                <span className="text-zinc-300">{computedBilling.short}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Start</span>
                <span className="text-zinc-300">{fmt(new Date(startDate))}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Features</span>
                <span className="text-zinc-300">{selectedFeatureList.length} premium features &middot; {Object.keys(selectedFeatures).length} categories</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Impact</span>
                <span className="text-green-400">+{gainedFeatures.length} features vs FREE &middot; FREE &rarr; {plan}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Reason</span>
                <span className="text-zinc-300">{notes || <span className="text-zinc-600">(not specified)</span>}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Notify</span>
                <span className={notifyUser ? "text-green-400" : "text-zinc-500"}>{notifyUser ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
