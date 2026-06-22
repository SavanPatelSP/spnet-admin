"use client";

import { useEffect, useMemo, useState } from "react";
import { cn, formatPrice, formatDateTime } from "@/lib/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  Percent, Plus, Edit2, Trash2, Power,
  Copy, Megaphone, Gift, ArrowUpRight, Timer, LayoutGrid, Ticket,
  TrendingUp, DollarSign, Users, Sparkles, Clock,
} from "lucide-react";
import { ALL_PLANS, PLAN_META } from "@/lib/premium";
import { LICENSE_TIERS, PLAN_PRICES } from "@/lib/constants";
import { getCoinPackage, getGemPackage } from "@/lib/economy-pricing";
import { PromoCodeModal } from "./PromoCodeModal";
import { DiscountCouponModal } from "./DiscountCouponModal";
import { CampaignModal } from "./CampaignModal";
import { LimitedTimeOfferModal } from "./LimitedTimeOfferModal";
import { FreeTrialOfferModal } from "./FreeTrialOfferModal";
import { UpgradePromotionModal } from "./UpgradePromotionModal";
import { PROMOTION_TYPES, type Promotion } from "./PromotionWorkflowModal";

export type PromotionType = (typeof PROMOTION_TYPES)[number]["key"];

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

function isExpired(endDate: string | null) {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

function timeRemaining(endDate: string | null) {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

function formatDiscount(type: string, value: number) {
  if (type === "PERCENTAGE") return `${value}% OFF`;
  if (value === 0) return "No discount";
  return `${formatPrice(value, "$")} OFF`;
}

const typeColors: Record<PromotionType, { text: string; bg: string; border: string }> = {
  PROMO_CODE: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  DISCOUNT_COUPON: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  CAMPAIGN: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  LIMITED_TIME_OFFER: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  FREE_TRIAL: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  UPGRADE_PROMOTION: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
};

function getProductPrice(appliesTo: string, targetPlan: string): number | undefined {
  if (!appliesTo || !targetPlan) return undefined;
  if (appliesTo === "PREMIUM") return PLAN_PRICES[targetPlan as keyof typeof PLAN_PRICES];
  if (appliesTo === "COIN") return getCoinPackage(targetPlan)?.price;
  if (appliesTo === "GEM") return getGemPackage(targetPlan)?.price;
  if (appliesTo === "LICENSE") return LICENSE_TIERS.find((t) => t.label === targetPlan)?.price;
  return undefined;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>{children}</span>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500",
        props.className,
      )}
    />
  );
}

function PromotionImpactSummary({ promotion }: { promotion: Promotion }) {
  const meta = parseMeta(promotion.metadata);
  const targetPrice = getProductPrice(promotion.appliesTo || "", promotion.targetPlan || "");
  const discountValue = promotion.discountValue || 0;
  const computedDiscount =
    promotion.discountType === "PERCENTAGE" && targetPrice
      ? Math.min(targetPrice, (targetPrice * discountValue) / 100)
      : promotion.discountType === "FIXED"
      ? discountValue
      : 0;

  const redemptionForecast = promotion.maxUses && promotion.maxUses > 0 ? promotion.maxUses : 1;
  const items: { label: string; value: string; tone?: "good" | "bad" | "neutral" }[] = [];

  if (promotion.productType === "FREE_TRIAL") {
    const trialDays = meta.trialLengthDays || 14;
    items.push({ label: "Trial duration", value: `${trialDays} days` });
    items.push({ label: "Projected MRR", value: targetPrice ? `$${(targetPrice * 0.15).toFixed(2)}/user` : "—" });
    items.push({ label: "Cost impact", value: targetPrice ? `$${(targetPrice * 0.15 * redemptionForecast).toFixed(2)} est.` : "—", tone: "bad" });
  } else if (promotion.productType === "CAMPAIGN") {
    items.push({ label: "Bundled", value: `${(meta.campaignPromotionIds || []).length} promotions` });
    items.push({ label: "Visibility", value: meta.visibility || "PUBLIC" });
    items.push({ label: "Forecast impact", value: `${(meta.campaignPromotionIds || []).length} bundled promotions` });
  } else if (promotion.productType === "UPGRADE_PROMOTION") {
    const fromPrice = meta.fromPlan ? PLAN_PRICES[meta.fromPlan] : undefined;
    const toPrice = meta.toPlan ? PLAN_PRICES[meta.toPlan] : undefined;
    const delta = fromPrice !== undefined && toPrice !== undefined ? toPrice - fromPrice : undefined;
    items.push({ label: "Upgrade delta", value: delta !== undefined ? `$${delta.toFixed(2)}/mo` : "—" });
    items.push({ label: "Revenue impact", value: delta !== undefined && delta > 0 ? `+$${delta.toFixed(2)}/user` : delta !== undefined ? "Downgrade" : "—", tone: delta !== undefined && delta > 0 ? "good" : "neutral" });
    items.push({ label: "Forecast impact", value: delta !== undefined && delta > 0 ? `+$${delta.toFixed(2)}/mo per upgrade` : "—" });
  } else {
    items.push({ label: "Discount", value: promotion.discountType === "PERCENTAGE" ? `${discountValue}%` : `$${discountValue.toFixed(2)}` });
    items.push({ label: "Effective price", value: targetPrice ? `$${Math.max(0, targetPrice - computedDiscount).toFixed(2)}` : "—" });
    items.push({ label: "Redemption forecast", value: promotion.maxUses ? `${promotion.maxUses} redemptions` : "Unlimited" });
    items.push({ label: "Revenue impact", value: targetPrice && computedDiscount ? `−$${(computedDiscount * redemptionForecast).toFixed(2)} est.` : "—", tone: "bad" });
    items.push({ label: "Cost impact", value: targetPrice && computedDiscount ? `$${(computedDiscount * redemptionForecast).toFixed(2)} est.` : "—", tone: "bad" });
  }

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-3">
      <p className="mb-2 text-xs font-semibold text-zinc-500">Impact Summary</p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] text-zinc-600">{item.label}</p>
            <p className={`text-xs font-medium ${item.tone === "good" ? "text-emerald-400" : item.tone === "bad" ? "text-red-400" : "text-zinc-300"}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromotionCard({
  promotion,
  allPromotions,
  onEdit,
  onDelete,
  onToggle,
  onCopy,
}: {
  promotion: Promotion;
  allPromotions: Promotion[];
  onEdit: (p: Promotion) => void;
  onDelete: (p: Promotion) => void;
  onToggle: (p: Promotion) => void;
  onCopy: (code: string) => void;
}) {
  const meta = parseMeta(promotion.metadata);
  const expired = isExpired(promotion.endDate);
  const remaining = timeRemaining(promotion.endDate);
  const colors = typeColors[promotion.productType];

  const campaignPromotions = useMemo(() => {
    if (promotion.productType !== "CAMPAIGN" || !meta.campaignPromotionIds?.length) return [];
    const map = new Map(allPromotions.map((p) => [p.id, p]));
    return meta.campaignPromotionIds.map((id) => map.get(id)).filter(Boolean) as Promotion[];
  }, [promotion, allPromotions, meta.campaignPromotionIds]);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold">{promotion.code}</h3>
            <Badge className={cn(colors.bg, colors.text, colors.border, "border")}>
              {PROMOTION_TYPES.find((t) => t.key === promotion.productType)?.label}
            </Badge>
          </div>
          {promotion.description && <p className="mt-1 text-sm text-zinc-400">{promotion.description}</p>}
        </div>
        <button
          onClick={() => onToggle(promotion)}
          className={cn(
            "rounded-full p-2 transition",
            promotion.active && !expired ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700",
          )}
          title={promotion.active && !expired ? "Deactivate" : "Activate"}
        >
          <Power size={16} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge className="bg-zinc-800 text-zinc-300">{formatDiscount(promotion.discountType, promotion.discountValue)}</Badge>
        {promotion.appliesTo && <Badge className="bg-zinc-800 text-zinc-300">{promotion.appliesTo}</Badge>}
        {promotion.targetPlan && <Badge className="bg-zinc-800 text-zinc-300">{promotion.targetPlan}</Badge>}
        {expired && <Badge className="bg-red-500/10 text-red-400 border border-red-500/20">Expired</Badge>}
        {!expired && remaining && <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">{remaining} left</Badge>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-400">
        <div><span className="block text-xs text-zinc-500">Start</span>{promotion.startDate ? formatDateTime(promotion.startDate) : "Always active"}</div>
        <div><span className="block text-xs text-zinc-500">End</span>{promotion.endDate ? formatDateTime(promotion.endDate) : "No expiry"}</div>
        <div><span className="block text-xs text-zinc-500">Usage</span>{promotion.usedCount}{promotion.maxUses ? ` / ${promotion.maxUses}` : " unlimited"}</div>
        {meta.perUserLimit !== undefined && meta.perUserLimit !== null && <div><span className="block text-xs text-zinc-500">Per-user limit</span>{meta.perUserLimit}</div>}
        {meta.trialLengthDays !== undefined && meta.trialLengthDays !== null && <div><span className="block text-xs text-zinc-500">Trial days</span>{meta.trialLengthDays}</div>}
        {meta.fromPlan && <div><span className="block text-xs text-zinc-500">Upgrade from</span>{meta.fromPlan}</div>}
        {meta.toPlan && <div><span className="block text-xs text-zinc-500">Upgrade to</span>{meta.toPlan}</div>}
        {meta.visibility && <div><span className="block text-xs text-zinc-500">Visibility</span>{meta.visibility}</div>}
      </div>

      <PromotionImpactSummary promotion={promotion} />

      {campaignPromotions.length > 0 && (
        <div className="mt-4">
          <span className="text-xs text-zinc-500">Bundled promotions</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {campaignPromotions.map((p) => (
              <Badge key={p.id} className="bg-purple-500/10 text-purple-300 border border-purple-500/20">{p.code}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-800 pt-4">
        <button onClick={() => onCopy(promotion.code)} className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" title="Copy code">
          <Copy size={16} />
        </button>
        <button onClick={() => onEdit(promotion)} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" title="Edit">
          <Edit2 size={16} />
        </button>
        <button onClick={() => onDelete(promotion)} className="rounded-xl p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400" title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

const MODAL_COMPONENTS = {
  PROMO_CODE: PromoCodeModal,
  DISCOUNT_COUPON: DiscountCouponModal,
  CAMPAIGN: CampaignModal,
  LIMITED_TIME_OFFER: LimitedTimeOfferModal,
  FREE_TRIAL: FreeTrialOfferModal,
  UPGRADE_PROMOTION: UpgradePromotionModal,
};

export function OffersPromotionsPage({ initialPromotions }: { initialPromotions?: Promotion[] }) {
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions ?? []);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<PromotionType>("PROMO_CODE");
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [createKey, setCreateKey] = useState(0);
  const [filter, setFilter] = useState<PromotionType | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const fetchPromotions = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load promotions");
      setPromotions(data.promotions || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load promotions", "error");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (initialPromotions === undefined) {
      fetchPromotions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return promotions.filter((p) => {
      const matchesType = filter === "ALL" || p.productType === filter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || p.code.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [promotions, filter, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: promotions.length };
    PROMOTION_TYPES.forEach((t) => (map[t.key] = promotions.filter((p) => p.productType === t.key).length));
    return map;
  }, [promotions]);

  const openCreate = (type: PromotionType) => {
    setModalType(type);
    setEditing(null);
    setCreateKey((k) => k + 1);
    setModalOpen(true);
  };

  const openEdit = (promotion: Promotion) => {
    setModalType(promotion.productType);
    setEditing(promotion);
    setModalOpen(true);
  };

  const handleDelete = async (promotion: Promotion) => {
    if (!confirm(`Delete promotion "${promotion.code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/offers/${promotion.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Delete failed");
      showToast("Promotion deleted", "success");
      fetchPromotions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  };

  const handleToggle = async (promotion: Promotion) => {
    try {
      const res = await fetch(`/api/offers/${promotion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !promotion.active }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Toggle failed");
      showToast(promotion.active ? "Promotion deactivated" : "Promotion activated", "success");
      fetchPromotions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Toggle failed", "error");
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => showToast("Code copied", "success"));
  };

  const ActiveModal = MODAL_COMPONENTS[modalType];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <PageHeader
        title="Offers & Promotions"
        description="Create and manage promo codes, coupons, campaigns, limited-time offers, free trials and upgrade promotions."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROMOTION_TYPES.map((type) => {
          const Icon = type.icon;
          const colors = typeColors[type.key];
          return (
            <div key={type.key} className={cn("rounded-3xl border bg-zinc-900/50 p-5 transition hover:border-zinc-700", colors.border)}>
              <div className="flex items-start justify-between">
                <div className={cn("rounded-2xl p-3", colors.bg)}>
                  <Icon className={colors.text} size={24} />
                </div>
                <Badge className={cn(colors.bg, colors.text)}>{counts[type.key] || 0}</Badge>
              </div>
              <h3 className="mt-4 font-bold">{type.label}</h3>
              <button
                onClick={() => openCreate(type.key)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
              >
                <Plus size={16} /> Create {type.label}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-4 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition",
              filter === "ALL" ? "bg-zinc-200 text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
            )}
          >
            All ({counts.ALL})
          </button>
          {PROMOTION_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => setFilter(type.key)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                filter === type.key ? "bg-zinc-200 text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200",
              )}
            >
              {type.label} ({counts[type.key]})
            </button>
          ))}
        </div>
        <div className="md:ml-auto md:w-72">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or description..." />
        </div>
      </div>

      {refreshing && (
        <div className="flex h-12 items-center justify-center text-zinc-500">
          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
          Refreshing...
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 text-zinc-500">
          <LayoutGrid size={40} className="mb-3 opacity-50" />
          <p className="font-medium">No promotions found</p>
          <p className="text-sm">Create a promotion from the cards above.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <PromotionCard
              key={p.id}
              promotion={p}
              allPromotions={promotions}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <ActiveModal
          key={editing?.id || `new-${modalType}-${createKey}`}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editingPromotion={editing}
          allPromotions={promotions}
          onSaved={fetchPromotions}
        />
      )}
    </div>
  );
}
