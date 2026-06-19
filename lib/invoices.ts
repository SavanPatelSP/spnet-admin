import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/shared";
import { COIN_PACKAGES, GEM_PACKAGES, LICENSE_TIERS, PLAN_PRICES } from "@/lib/constants";

export type InvoiceStatus = "DRAFT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
export type InvoiceType = "SALE" | "REFUND" | "CREDIT";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number; // cents
  total: number; // cents
}

export type PromotionProductType =
  | "PROMO_CODE"
  | "DISCOUNT_COUPON"
  | "CAMPAIGN"
  | "LIMITED_TIME_OFFER"
  | "FREE_TRIAL"
  | "UPGRADE_PROMOTION";

export interface PromotionInvoiceInput {
  code: string;
  productType: PromotionProductType;
  appliesTo: string | null;
  targetPlan: string | null;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  fromPlan?: string | null;
  toPlan?: string | null;
}

function cents(amount: number): number {
  return Math.round(amount * 100);
}

export async function generateInvoiceNumber(): Promise<string> {
  const date = new Date();
  const prefix = "INV";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const count = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: `${prefix}-${y}${m}` } },
  });
  return `${prefix}-${y}${m}-${String(count + 1).padStart(5, "0")}`;
}

export type InvoiceCategory =
  | "PREMIUM"
  | "LICENSE"
  | "COIN"
  | "GEM"
  | "PROMOTION"
  | "ORGANIZATION"
  | "SESSION"
  | "OTHER";

interface CreateInvoiceInput {
  licenseId?: string;
  organization?: string;
  customerName?: string;
  customerEmail?: string;
  status?: InvoiceStatus;
  type?: InvoiceType;
  category?: InvoiceCategory;
  action?: string;
  subtotal: number; // dollars
  discount?: number; // dollars
  tax?: number; // dollars
  currency?: string;
  lineItems: InvoiceLineItem[];
  dueDays?: number;
  notes?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const invoiceNumber = await generateInvoiceNumber();
  const subtotal = cents(input.subtotal);
  const discount = cents(input.discount ?? 0);
  const tax = cents(input.tax ?? 0);
  const total = Math.max(0, subtotal - discount + tax);

  let licenseOrganization: string | undefined;
  let licenseCustomer: string | undefined;
  if (input.licenseId) {
    const license = await prisma.license.findUnique({
      where: { id: input.licenseId },
      select: { organization: true, teamMember: { select: { name: true, email: true } } },
    });
    if (license) {
      licenseOrganization = license.organization;
      if (license.teamMember) {
        licenseCustomer = license.teamMember.name ?? undefined;
      }
    }
  }

  return prisma.invoice.create({
    data: {
      invoiceNumber,
      licenseId: input.licenseId,
      organization: input.organization || licenseOrganization,
      customerName: input.customerName || licenseCustomer,
      customerEmail: input.customerEmail,
      status: input.status || "PENDING",
      type: input.type || "SALE",
      category: input.category || "OTHER",
      action: input.action,
      subtotal,
      discount,
      tax,
      total,
      currency: input.currency || "USD",
      lineItems: JSON.stringify(input.lineItems),
      dueAt: input.dueDays ? new Date(Date.now() + input.dueDays * 24 * 60 * 60 * 1000) : undefined,
      notes: input.notes,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    },
  });
}

export function formatInvoiceTotal(totalCents: number): string {
  return formatPrice(totalCents / 100, "$");
}

export async function createInvoiceForLicense(licenseId: string, tierLabel: string, price: number, relatedEntityId?: string) {
  return createInvoice({
    licenseId,
    category: "LICENSE",
    action: "CREATE",
    subtotal: price,
    lineItems: [
      { description: `License — ${tierLabel}`, quantity: 1, unitPrice: cents(price), total: cents(price) },
    ],
    relatedEntityType: "LICENSE_CREATE",
    relatedEntityId,
    dueDays: 30,
    notes: `Auto-generated invoice for license creation (${tierLabel}).`,
  });
}

export async function createInvoiceForPremium(licenseId: string, plan: string, price: number, relatedEntityId?: string) {
  return createInvoice({
    licenseId,
    category: "PREMIUM",
    action: "GRANT",
    subtotal: price,
    lineItems: [
      { description: `Premium plan — ${plan}`, quantity: 1, unitPrice: cents(price), total: cents(price) },
    ],
    relatedEntityType: "PREMIUM_GRANT",
    relatedEntityId,
    dueDays: 30,
    notes: `Auto-generated invoice for premium grant (${plan}).`,
  });
}

export async function createInvoiceForPremiumAction(
  licenseId: string,
  action: string,
  plan: string,
  price: number,
  relatedEntityId?: string,
) {
  const actionLabels: Record<string, string> = {
    EXTEND: "Premium extension",
    CHANGE_PLAN: "Premium plan change",
    CONVERT_LIFETIME: "Lifetime conversion",
    CONVERT_CUSTOM: "Custom plan conversion",
    DOWNGRADE: "Premium downgrade",
    UPGRADE: "Premium upgrade",
  };
  const actionKey =
    action === "CONVERTED_TO_LIFETIME" ? "CONVERT_LIFETIME"
    : action === "CONVERTED_TO_CUSTOM" ? "CONVERT_CUSTOM"
    : action === "DOWNGRADED" ? "DOWNGRADE"
    : action === "UPGRADED" ? "UPGRADE"
    : action === "PLAN_CHANGED" ? "CHANGE_PLAN"
    : action;
  const label = actionLabels[actionKey] || `Premium action — ${actionKey}`;
  return createInvoice({
    licenseId,
    category: "PREMIUM",
    action: actionKey,
    subtotal: price,
    lineItems: [
      { description: `${label} — ${plan}`, quantity: 1, unitPrice: cents(price), total: cents(price) },
    ],
    relatedEntityType: `PREMIUM_${actionKey}`,
    relatedEntityId,
    dueDays: 30,
    notes: `Auto-generated invoice for ${label.toLowerCase()} (${plan}).`,
  });
}

function getProductBasePrice(appliesTo: string | null, targetPlan: string | null): number | undefined {
  if (!appliesTo || !targetPlan) return undefined;
  if (appliesTo === "PREMIUM") return PLAN_PRICES[targetPlan];
  if (appliesTo === "COIN") return COIN_PACKAGES.find((p) => p.label === targetPlan)?.price;
  if (appliesTo === "GEM") return GEM_PACKAGES.find((p) => p.label === targetPlan)?.price;
  if (appliesTo === "LICENSE") return LICENSE_TIERS.find((t) => t.label === targetPlan)?.price;
  return undefined;
}

export function computePromotionImpact(input: PromotionInvoiceInput): { description: string; amount: number } | null {
  const { productType, appliesTo, targetPlan, discountType, discountValue, maxUses, fromPlan, toPlan } = input;

  if (productType === "FREE_TRIAL" || productType === "CAMPAIGN") {
    return null;
  }

  if (productType === "UPGRADE_PROMOTION") {
    const fromPrice = fromPlan ? PLAN_PRICES[fromPlan] : undefined;
    const toPrice = toPlan ? PLAN_PRICES[toPlan] : undefined;
    if (fromPrice === undefined || toPrice === undefined) return null;
    const delta = toPrice - fromPrice;
    if (delta <= 0) return null;
    return {
      description: `Upgrade promotion revenue impact — ${fromPlan} to ${toPlan}`,
      amount: delta,
    };
  }

  const targetPrice = getProductBasePrice(appliesTo, targetPlan);
  if (targetPrice === undefined || targetPrice <= 0) return null;

  const computedDiscount =
    discountType === "PERCENTAGE"
      ? Math.min(targetPrice, (targetPrice * discountValue) / 100)
      : discountType === "FIXED"
      ? Math.min(targetPrice, discountValue)
      : 0;

  if (computedDiscount <= 0) return null;

  const redemptionCount = maxUses && maxUses > 0 ? maxUses : 1;
  return {
    description: `Promotion revenue/cost impact — ${input.code}`,
    amount: computedDiscount * redemptionCount,
  };
}

export async function createInvoiceForPromotion(
  input: PromotionInvoiceInput,
  relatedEntityId?: string,
) {
  const impact = computePromotionImpact(input);
  if (!impact || impact.amount <= 0) return null;

  return createInvoice({
    organization: `Promotion ${input.code}`,
    customerName: `Promotion ${input.code}`,
    status: "PENDING",
    type: "SALE",
    category: "PROMOTION",
    action: input.productType,
    subtotal: impact.amount,
    lineItems: [
      {
        description: impact.description,
        quantity: input.maxUses && input.maxUses > 0 ? input.maxUses : 1,
        unitPrice: cents(impact.amount / (input.maxUses && input.maxUses > 0 ? input.maxUses : 1)),
        total: cents(impact.amount),
      },
    ],
    dueDays: 30,
    notes: `Auto-generated invoice for ${input.productType} "${input.code}".`,
    relatedEntityType: "PROMOTION",
    relatedEntityId,
  });
}
