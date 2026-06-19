"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { cn, formatPrice } from "@/lib/shared";
import { ALL_PLANS, PLAN_META } from "@/lib/premium";
import { COIN_PACKAGES, GEM_PACKAGES, LICENSE_TIERS, PLAN_PRICES } from "@/lib/constants";
import {
  Ticket, Percent, Megaphone, Timer, Gift, ArrowUpRight,
  TrendingUp, DollarSign, Users, Sparkles, Clock, FileText,
  Shield, AlertTriangle, CheckCircle, Zap, BarChart3,
} from "lucide-react";

export const PROMOTION_TYPES = [
  { key: "PROMO_CODE", label: "Promo Code", icon: Ticket },
  { key: "DISCOUNT_COUPON", label: "Discount Coupon", icon: Percent },
  { key: "CAMPAIGN", label: "Campaign", icon: Megaphone },
  { key: "LIMITED_TIME_OFFER", label: "Limited-Time Offer", icon: Timer },
  { key: "FREE_TRIAL", label: "Free Trial Offer", icon: Gift },
  { key: "UPGRADE_PROMOTION", label: "Upgrade Promotion", icon: ArrowUpRight },
] as const;

export type PromotionType = (typeof PROMOTION_TYPES)[number]["key"];

const APPLIES_TO_OPTIONS = [
  { value: "PREMIUM", label: "Premium Plans" },
  { value: "COIN", label: "Coin Packages" },
  { value: "GEM", label: "Gem Packages" },
  { value: "LICENSE", label: "License Packages" },
];

export interface Promotion {
  id: string;
  code: string;
  description: string | null;
  productType: PromotionType;
  appliesTo: string | null;
  targetPlan: string | null;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PromotionMeta {
  perUserLimit?: number | null;
  trialLengthDays?: number | null;
  fromPlan?: string | null;
  toPlan?: string | null;
  visibility?: string | null;
  campaignPromotionIds?: string[] | null;
}

function parseMeta(metadata: string | null): PromotionMeta {
  if (!metadata) return {};
  try { return JSON.parse(metadata) as PromotionMeta; } catch { return {}; }
}

function toDateInputValue(date: string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-CA");
}

const planOptions = ALL_PLANS.map((p) => ({ value: p, label: PLAN_META[p]?.label || p }));
const coinOptions = COIN_PACKAGES.map((p) => ({ value: p.label, label: `${p.label} — ${p.amount} coins` }));
const gemOptions = GEM_PACKAGES.map((p) => ({ value: p.label, label: `${p.label} — ${p.amount} gems` }));
const licenseOptions = LICENSE_TIERS.map((t) => ({ value: t.label, label: t.label }));

function targetOptions(appliesTo: string | null) {
  if (appliesTo === "PREMIUM") return planOptions;
  if (appliesTo === "COIN") return coinOptions;
  if (appliesTo === "GEM") return gemOptions;
  if (appliesTo === "LICENSE") return licenseOptions;
  return [];
}

function getProductPrice(appliesTo: string, targetPlan: string): number | undefined {
  if (!appliesTo || !targetPlan) return undefined;
  if (appliesTo === "PREMIUM") return PLAN_PRICES[targetPlan as keyof typeof PLAN_PRICES];
  if (appliesTo === "COIN") return COIN_PACKAGES.find((p) => p.label === targetPlan)?.price;
  if (appliesTo === "GEM") return GEM_PACKAGES.find((p) => p.label === targetPlan)?.price;
  if (appliesTo === "LICENSE") return LICENSE_TIERS.find((t) => t.label === targetPlan)?.price;
  return undefined;
}

function getTargetLabel(appliesTo: string, targetPlan: string): string {
  if (!appliesTo || !targetPlan) return "Selected product";
  if (appliesTo === "PREMIUM") return PLAN_META[targetPlan as keyof typeof PLAN_META]?.label || targetPlan;
  const list: { label: string }[] = appliesTo === "COIN" ? COIN_PACKAGES : appliesTo === "GEM" ? GEM_PACKAGES : LICENSE_TIERS;
  return list.find((p) => p.label === targetPlan)?.label ?? targetPlan;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>{children}</span>;
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Select({ value, onChange, options, placeholder = "Select..." }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500">
      <option value="">{placeholder}</option>
      {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500", props.className)} />;
}

const typeDescriptions: Record<PromotionType, string> = {
  PROMO_CODE: "Create a reusable code customers can apply at checkout.",
  DISCOUNT_COUPON: "Create a coupon with a fixed or percentage discount.",
  CAMPAIGN: "Bundle multiple promotions into a single campaign.",
  LIMITED_TIME_OFFER: "Create a time-bound offer with urgency.",
  FREE_TRIAL: "Offer a free trial to convert users to paid plans.",
  UPGRADE_PROMOTION: "Incentivize users to upgrade from one plan to another.",
};

const typeColors: Record<PromotionType, { text: string; bg: string; border: string }> = {
  PROMO_CODE: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  DISCOUNT_COUPON: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  CAMPAIGN: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  LIMITED_TIME_OFFER: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  FREE_TRIAL: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  UPGRADE_PROMOTION: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
};

function ImpactCard({ label, value, tone = "neutral", icon }: { label: string; value: string; tone?: "good" | "bad" | "neutral"; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-1 flex items-center gap-2 text-zinc-500">{icon}<span className="text-xs">{label}</span></div>
      <p className={`text-sm font-semibold ${tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-red-400" : "text-zinc-200"}`}>{value}</p>
    </div>
  );
}

export function PromotionWorkflowModal({
  productType,
  open,
  onClose,
  editingPromotion,
  allPromotions,
  onSaved,
}: {
  productType: PromotionType;
  open: boolean;
  onClose: () => void;
  editingPromotion: Promotion | null;
  allPromotions: Promotion[];
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const meta = editingPromotion ? parseMeta(editingPromotion.metadata) : {};
  const [form, setForm] = useState({
    code: editingPromotion?.code || "",
    description: editingPromotion?.description || "",
    appliesTo: editingPromotion?.appliesTo || "",
    targetPlan: editingPromotion?.targetPlan || "",
    discountType: (editingPromotion?.discountType as "PERCENTAGE" | "FIXED") || "FIXED",
    discountValue: editingPromotion ? String(editingPromotion.discountValue) : "",
    maxUses: editingPromotion?.maxUses !== null && editingPromotion?.maxUses !== undefined ? String(editingPromotion.maxUses) : "",
    perUserLimit: meta.perUserLimit !== undefined && meta.perUserLimit !== null ? String(meta.perUserLimit) : "",
    startDate: toDateInputValue(editingPromotion?.startDate || null),
    endDate: toDateInputValue(editingPromotion?.endDate || null),
    active: editingPromotion?.active ?? true,
    trialLengthDays: meta.trialLengthDays !== undefined && meta.trialLengthDays !== null ? String(meta.trialLengthDays) : "14",
    fromPlan: meta.fromPlan || "",
    toPlan: meta.toPlan || "",
    visibility: meta.visibility || "PUBLIC",
    campaignPromotionIds: meta.campaignPromotionIds || [],
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const typeLabel = PROMOTION_TYPES.find((t) => t.key === productType)?.label || productType;
  const colors = typeColors[productType];
  const TypeIcon = PROMOTION_TYPES.find((t) => t.key === productType)?.icon || Ticket;

  const targetPrice = useMemo(() => getProductPrice(form.appliesTo, form.targetPlan), [form.appliesTo, form.targetPlan]);
  const targetLabel = useMemo(() => getTargetLabel(form.appliesTo, form.targetPlan), [form.appliesTo, form.targetPlan]);
  const discountValue = parseFloat(form.discountValue) || 0;
  const maxUses = parseInt(form.maxUses, 10) || 0;
  const redemptionForecast = maxUses > 0 ? maxUses : 1;
  const computedDiscount = useMemo(() => {
    if (!targetPrice) return 0;
    if (form.discountType === "PERCENTAGE") return Math.min(targetPrice, (targetPrice * discountValue) / 100);
    if (form.discountType === "FIXED") return Math.min(targetPrice, discountValue);
    return 0;
  }, [targetPrice, form.discountType, discountValue]);

  const trialDays = parseInt(form.trialLengthDays, 10) || 14;
  const conversionRate = 0.15;

  const impact = useMemo(() => {
    if (productType === "FREE_TRIAL") {
      const revenueImpact = targetPrice ? -(targetPrice * conversionRate * redemptionForecast) : 0;
      return {
        revenue: revenueImpact,
        cost: revenueImpact,
        forecast: targetPrice ? targetPrice * conversionRate * redemptionForecast : 0,
        redemption: `${redemptionForecast} trials`,
        description: `Free trial — ${trialDays} days`,
        risk: "Medium — trial users may not convert.",
      };
    }
    if (productType === "CAMPAIGN") {
      const bundled = form.campaignPromotionIds.length;
      return {
        revenue: 0,
        cost: 0,
        forecast: bundled,
        redemption: `${bundled} bundled promotions`,
        description: `Campaign — ${form.visibility || "PUBLIC"}`,
        risk: bundled === 0 ? "High — no promotions bundled." : "Low — bundled promotions increase reach.",
      };
    }
    if (productType === "UPGRADE_PROMOTION") {
      const fromPrice = form.fromPlan ? PLAN_PRICES[form.fromPlan as keyof typeof PLAN_PRICES] : undefined;
      const toPrice = form.toPlan ? PLAN_PRICES[form.toPlan as keyof typeof PLAN_PRICES] : undefined;
      const delta = fromPrice !== undefined && toPrice !== undefined ? toPrice - fromPrice : 0;
      return {
        revenue: delta > 0 ? delta * redemptionForecast : 0,
        cost: 0,
        forecast: delta > 0 ? delta * redemptionForecast : 0,
        redemption: `${redemptionForecast} upgrades`,
        description: `Upgrade from ${form.fromPlan || "any"} to ${form.toPlan || "target"}`,
        risk: delta <= 0 ? "High — upgrade delta is zero or negative." : "Low — positive upgrade revenue.",
      };
    }
    const revenueImpact = computedDiscount > 0 ? -(computedDiscount * redemptionForecast) : 0;
    return {
      revenue: revenueImpact,
      cost: revenueImpact,
      forecast: computedDiscount > 0 ? computedDiscount * redemptionForecast : 0,
      redemption: maxUses > 0 ? `${maxUses} redemptions` : "Unlimited",
      description: `${form.discountType === "PERCENTAGE" ? `${discountValue}%` : `$${discountValue.toFixed(2)}`} off ${targetLabel}`,
      risk: computedDiscount >= (targetPrice || 0) * 0.5 ? "High — discount is 50% or more." : computedDiscount > 0 ? "Medium — standard discount risk." : "Low — no discount configured.",
    };
  }, [productType, targetPrice, computedDiscount, redemptionForecast, maxUses, form.discountType, discountValue, targetLabel, form.campaignPromotionIds.length, form.visibility, form.fromPlan, form.toPlan, trialDays]);

  const invoiceAmount = useMemo(() => {
    if (productType === "CAMPAIGN") return 0;
    if (productType === "FREE_TRIAL") return Math.abs(impact.cost);
    if (productType === "UPGRADE_PROMOTION") return impact.revenue;
    return Math.abs(impact.revenue);
  }, [impact, productType]);

  const availableForBundle = useMemo(
    () => allPromotions.filter((p) => p.id !== editingPromotion?.id && p.productType !== "CAMPAIGN"),
    [allPromotions, editingPromotion]
  );

  async function handleSubmit() {
    setSaving(true);
    try {
      const value = Number(form.discountValue);
      if (!Number.isFinite(value) || value < 0) {
        showToast("Discount value must be a positive number", "error");
        setSaving(false);
        return;
      }
      if (form.discountType === "PERCENTAGE" && value > 100) {
        showToast("Percentage discount cannot exceed 100%", "error");
        setSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {
        code: form.code.trim(),
        description: form.description.trim() || null,
        productType,
        appliesTo: form.appliesTo || null,
        targetPlan: form.targetPlan || null,
        discountType: form.discountType,
        discountValue: value,
        maxUses: form.maxUses !== "" ? Number(form.maxUses) : null,
        perUserLimit: form.perUserLimit !== "" ? Number(form.perUserLimit) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        active: form.active,
        trialLengthDays: form.trialLengthDays !== "" ? Number(form.trialLengthDays) : null,
        fromPlan: form.fromPlan || null,
        toPlan: form.toPlan || null,
        visibility: form.visibility || null,
        campaignPromotionIds: form.campaignPromotionIds.length ? form.campaignPromotionIds : null,
      };

      const url = editingPromotion ? `/api/offers/${editingPromotion.id}` : "/api/offers";
      const method = editingPromotion ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save promotion");
      showToast(editingPromotion ? "Promotion updated" : "Promotion created", "success");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const isValid = () => {
    if (!form.code.trim()) return false;
    if (productType === "UPGRADE_PROMOTION" && (!form.fromPlan || !form.toPlan)) return false;
    if (productType === "FREE_TRIAL" && !form.appliesTo) return false;
    if (["PROMO_CODE", "DISCOUNT_COUPON", "LIMITED_TIME_OFFER"].includes(productType) && computedDiscount <= 0) return false;
    if (productType === "CAMPAIGN" && form.campaignPromotionIds.length === 0) return false;
    return true;
  };

  const targetOptionsList = targetOptions(form.appliesTo);

  return (
    <Modal
      open={open}
      onClose={() => { if (!saving) onClose(); }}
      title={`${editingPromotion ? "Edit" : "Create"} ${typeLabel}`}
      description={typeDescriptions[productType]}
      size="xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving || !isValid()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            {saving ? "Saving..." : editingPromotion ? "Update" : "Create"}
          </button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: Configuration */}
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className={cn("rounded-xl p-2", colors.bg)}><TypeIcon className={colors.text} size={20} /></div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">{typeLabel}</p>
              <p className="text-xs text-zinc-500">{typeDescriptions[productType]}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <p className="mb-3 text-sm font-semibold text-zinc-200">Promotion Configuration</p>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Code"><Input value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="e.g. SUMMER25" /></FormField>
                <FormField label="Description" hint="Optional"><Input value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Summer campaign" /></FormField>
              </div>

              {(productType === "PROMO_CODE" || productType === "DISCOUNT_COUPON" || productType === "LIMITED_TIME_OFFER" || productType === "FREE_TRIAL") && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Applies to">
                    <Select value={form.appliesTo} onChange={(v) => { update("appliesTo", v); update("targetPlan", ""); }} options={APPLIES_TO_OPTIONS} placeholder="Any product" />
                  </FormField>
                  <FormField label="Target plan / package">
                    <Select value={form.targetPlan} onChange={(v) => update("targetPlan", v)} options={targetOptionsList} placeholder={form.appliesTo ? "Select target..." : "Choose applies-to first"} />
                  </FormField>
                </div>
              )}

              {(productType === "PROMO_CODE" || productType === "DISCOUNT_COUPON" || productType === "LIMITED_TIME_OFFER") && (
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField label="Discount type">
                    <Select value={form.discountType} onChange={(v) => update("discountType", v as "PERCENTAGE" | "FIXED")} options={[{ value: "FIXED", label: "Fixed amount" }, { value: "PERCENTAGE", label: "Percentage" }]} />
                  </FormField>
                  <FormField label={form.discountType === "PERCENTAGE" ? "Discount %" : "Discount amount ($)"}>
                    <Input type="number" min={0} max={form.discountType === "PERCENTAGE" ? 100 : undefined} step="0.01" value={form.discountValue} onChange={(e) => update("discountValue", e.target.value)} placeholder="0" />
                  </FormField>
                  <FormField label="Max uses" hint="Blank = unlimited"><Input type="number" min={0} value={form.maxUses} onChange={(e) => update("maxUses", e.target.value)} placeholder="Unlimited" /></FormField>
                </div>
              )}

              {(productType === "PROMO_CODE" || productType === "DISCOUNT_COUPON") && (
                <FormField label="Per-user limit" hint="Max redemptions per user"><Input type="number" min={0} value={form.perUserLimit} onChange={(e) => update("perUserLimit", e.target.value)} placeholder="Unlimited" /></FormField>
              )}

              {productType === "FREE_TRIAL" && (
                <FormField label="Trial length (days)"><Input type="number" min={1} value={form.trialLengthDays} onChange={(e) => update("trialLengthDays", e.target.value)} placeholder="14" /></FormField>
              )}

              {productType === "UPGRADE_PROMOTION" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="From plan"><Select value={form.fromPlan} onChange={(v) => update("fromPlan", v)} options={planOptions} placeholder="Any current plan" /></FormField>
                  <FormField label="To plan"><Select value={form.toPlan} onChange={(v) => update("toPlan", v)} options={planOptions} placeholder="Target plan" /></FormField>
                </div>
              )}

              {productType === "CAMPAIGN" && (
                <div className="space-y-4">
                  <FormField label="Visibility">
                    <Select value={form.visibility} onChange={(v) => update("visibility", v)} options={[{ value: "PUBLIC", label: "Public" }, { value: "HIDDEN", label: "Hidden" }, { value: "TARGETED", label: "Targeted" }]} />
                  </FormField>
                  <FormField label="Bundled promotions" hint="Select promotions to include">
                    {availableForBundle.length === 0 ? <p className="text-sm text-zinc-500">Create non-campaign promotions first.</p> : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {availableForBundle.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-sm text-zinc-300 hover:border-zinc-700">
                            <input type="checkbox" checked={form.campaignPromotionIds.includes(p.id)} onChange={(e) => { const ids = new Set(form.campaignPromotionIds); if (e.target.checked) ids.add(p.id); else ids.delete(p.id); update("campaignPromotionIds", [...ids]); }} className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-600" />
                            <span className="truncate">{p.code}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </FormField>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Start date"><Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></FormField>
                <FormField label="End date"><Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></FormField>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} className="h-5 w-5 rounded border-zinc-600 bg-zinc-800 text-blue-600" />
                <span className="text-sm font-medium text-zinc-300">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT: Impact & Summary */}
        <div className="space-y-5">
          <div className={cn("rounded-2xl border bg-zinc-950/70 p-5", colors.border)}>
            <div className="mb-4 flex items-center gap-2"><TrendingUp size={18} className={colors.text} /><h4 className="font-semibold text-zinc-200">Live Impact</h4></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ImpactCard label="Revenue Impact" value={impact.revenue < 0 ? `−$${Math.abs(impact.revenue).toFixed(2)}` : impact.revenue > 0 ? `+$${impact.revenue.toFixed(2)}` : "—"} tone={impact.revenue < 0 ? "bad" : impact.revenue > 0 ? "good" : "neutral"} icon={<DollarSign size={16} />} />
              <ImpactCard label="Cost Impact" value={impact.cost < 0 ? `−$${Math.abs(impact.cost).toFixed(2)}` : impact.cost > 0 ? `+$${impact.cost.toFixed(2)}` : "—"} tone={impact.cost < 0 ? "bad" : impact.cost > 0 ? "good" : "neutral"} icon={<DollarSign size={16} />} />
              <ImpactCard label="Forecast Impact" value={impact.forecast > 0 ? `$${impact.forecast.toFixed(2)}` : productType === "CAMPAIGN" ? `${impact.forecast}` : "—"} icon={<BarChart3 size={16} />} />
              <ImpactCard label="Redemption Forecast" value={impact.redemption} icon={<Users size={16} />} />
            </div>
            {productType !== "CAMPAIGN" && (
              <div className="mt-4 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-3">
                <p className="text-xs text-blue-300/80">Target: <span className="font-medium text-blue-200">{targetLabel}</span>{targetPrice ? ` at $${targetPrice.toFixed(2)}` : null}</p>
              </div>
            )}
          </div>

          {invoiceAmount > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"><FileText size={14} /> Invoice Preview</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-zinc-800 pb-2"><span className="text-zinc-400">{impact.description}</span><span className="text-zinc-200">${invoiceAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-medium"><span className="text-zinc-300">Total</span><span className="text-zinc-100">${invoiceAmount.toFixed(2)}</span></div>
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">An invoice will be generated on save if this impact exists.</p>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"><Sparkles size={14} /> Promotion Summary</p>
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between"><span className="text-zinc-500">Type</span><span className={colors.text}>{typeLabel}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Code</span><span>{form.code || "—"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Target</span><span>{targetLabel}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Discount</span><span>{form.discountType === "PERCENTAGE" ? `${discountValue}%` : `$${discountValue.toFixed(2)}`}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Max redemptions</span><span>{maxUses > 0 ? maxUses : "Unlimited"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Status</span><span>{form.active ? "Active" : "Inactive"}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-300"><Shield size={16} /> Risk Summary</div>
            <p className="text-xs leading-relaxed text-yellow-200/80">{impact.risk}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
