import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { createInvoiceForPromotion } from "@/lib/invoices";

const PRODUCT_TYPES = ["PROMO_CODE", "DISCOUNT_COUPON", "CAMPAIGN", "LIMITED_TIME_OFFER", "FREE_TRIAL", "UPGRADE_PROMOTION"];
const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"];

export async function GET() {
  try {
    await requireApiPermission("Manage Billing");
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, promotions });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Manage Billing");
    const body = await req.json();

    const {
      code,
      description,
      productType,
      appliesTo,
      targetPlan,
      discountType,
      discountValue,
      maxUses,
      perUserLimit,
      startDate,
      endDate,
      active,
      metadata,
      trialLengthDays,
      fromPlan,
      toPlan,
      visibility,
      campaignPromotionIds,
    } = body;

    if (!code?.trim()) {
      return Response.json({ success: false, error: "Code is required" }, { status: 400 });
    }

    if (!PRODUCT_TYPES.includes(productType)) {
      return Response.json({ success: false, error: "Invalid promotion type" }, { status: 400 });
    }

    const effectiveDiscountType = discountType || "FIXED";
    if (!DISCOUNT_TYPES.includes(effectiveDiscountType)) {
      return Response.json({ success: false, error: "Invalid discount type" }, { status: 400 });
    }

    const value = Number(discountValue ?? 0);
    if (!Number.isFinite(value) || value < 0) {
      return Response.json({ success: false, error: "Discount value must be a positive number" }, { status: 400 });
    }

    if (effectiveDiscountType === "PERCENTAGE" && value > 100) {
      return Response.json({ success: false, error: "Percentage discount cannot exceed 100%" }, { status: 400 });
    }

    const meta: Record<string, unknown> = {};
    if (perUserLimit !== undefined) meta.perUserLimit = Number(perUserLimit) || null;
    if (trialLengthDays !== undefined) meta.trialLengthDays = Number(trialLengthDays) || null;
    if (fromPlan !== undefined) meta.fromPlan = fromPlan?.trim() || null;
    if (toPlan !== undefined) meta.toPlan = toPlan?.trim() || null;
    if (visibility !== undefined) meta.visibility = visibility?.trim() || null;
    if (campaignPromotionIds !== undefined) meta.campaignPromotionIds = Array.isArray(campaignPromotionIds) ? campaignPromotionIds : null;
    if (metadata && typeof metadata === "object") Object.assign(meta, metadata);

    const promotion = await prisma.promotion.create({
      data: {
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        productType,
        appliesTo: appliesTo?.trim() || null,
        targetPlan: targetPlan?.trim() || null,
        discountType: effectiveDiscountType,
        discountValue: value,
        maxUses: maxUses !== null && maxUses !== undefined && maxUses !== "" ? Number(maxUses) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        active: active !== false,
        createdBy: session.user.email,
        metadata: Object.keys(meta).length > 0 ? JSON.stringify(meta) : null,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.PROMOTION_CREATED,
      null, null, session.user.role, session.user.name,
      `Promotion "${promotion.code}" created for ${promotion.productType}`,
      session.user.email,
    );

    try {
      await createInvoiceForPromotion(
        {
          code: promotion.code,
          productType: promotion.productType as never,
          appliesTo: promotion.appliesTo,
          targetPlan: promotion.targetPlan,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          maxUses: promotion.maxUses,
          fromPlan: meta.fromPlan as string | undefined,
          toPlan: meta.toPlan as string | undefined,
        },
        promotion.id,
      );
    } catch {
      // Invoice generation is best-effort.
    }

    return Response.json({ success: true, promotion });
  } catch (e) {
    return handleApiError(e);
  }
}
