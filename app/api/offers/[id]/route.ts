import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { createInvoiceForPromotion, type PromotionProductType } from "@/lib/invoices";

const PRODUCT_TYPES = ["PROMO_CODE", "DISCOUNT_COUPON", "CAMPAIGN", "LIMITED_TIME_OFFER", "FREE_TRIAL", "UPGRADE_PROMOTION"];
const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"];

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getPromotion(id: string) {
  const promotion = await prisma.promotion.findUnique({ where: { id } });
  if (!promotion) throw new NotFoundError("Promotion not found");
  return promotion;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    await requireApiPermission("Manage Billing");
    const { id } = await context.params;
    const promotion = await getPromotion(id);
    return Response.json({ success: true, promotion });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await requireApiPermission("Manage Billing");
    const { id } = await context.params;
    const existing = await getPromotion(id);
    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) {
      if (!body.code.trim()) throw new ValidationError("Code is required");
      updateData.code = body.code.trim().toUpperCase();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.productType !== undefined) {
      if (!PRODUCT_TYPES.includes(body.productType)) throw new ValidationError("Invalid product type");
      updateData.productType = body.productType;
    }

    if (body.appliesTo !== undefined) {
      updateData.appliesTo = body.appliesTo?.trim() || null;
    }

    if (body.targetPlan !== undefined) {
      updateData.targetPlan = body.targetPlan?.trim() || null;
    }

    if (body.discountType !== undefined) {
      if (!DISCOUNT_TYPES.includes(body.discountType)) throw new ValidationError("Invalid discount type");
      updateData.discountType = body.discountType;
    }

    if (body.discountValue !== undefined) {
      const value = Number(body.discountValue);
      if (!Number.isFinite(value) || value < 0) throw new ValidationError("Discount value must be a positive number");
      if (updateData.discountType === "PERCENTAGE" || (updateData.discountType === undefined && existing.discountType === "PERCENTAGE")) {
        if (value > 100) throw new ValidationError("Percentage discount cannot exceed 100%");
      }
      updateData.discountValue = value;
    }

    if (body.maxUses !== undefined) {
      updateData.maxUses = body.maxUses !== null && body.maxUses !== "" ? Number(body.maxUses) : null;
    }

    if (body.startDate !== undefined) {
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    }

    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    if (body.active !== undefined) {
      updateData.active = Boolean(body.active);
    }

    if (body.metadata !== undefined || body.perUserLimit !== undefined || body.trialLengthDays !== undefined || body.fromPlan !== undefined || body.toPlan !== undefined || body.visibility !== undefined || body.campaignPromotionIds !== undefined) {
      const meta: Record<string, unknown> = existing.metadata ? JSON.parse(existing.metadata) : {};
      if (body.perUserLimit !== undefined) meta.perUserLimit = Number(body.perUserLimit) || null;
      if (body.trialLengthDays !== undefined) meta.trialLengthDays = Number(body.trialLengthDays) || null;
      if (body.fromPlan !== undefined) meta.fromPlan = body.fromPlan?.trim() || null;
      if (body.toPlan !== undefined) meta.toPlan = body.toPlan?.trim() || null;
      if (body.visibility !== undefined) meta.visibility = body.visibility?.trim() || null;
      if (body.campaignPromotionIds !== undefined) meta.campaignPromotionIds = Array.isArray(body.campaignPromotionIds) ? body.campaignPromotionIds : null;
      if (body.metadata && typeof body.metadata === "object") Object.assign(meta, body.metadata);
      updateData.metadata = Object.keys(meta).length > 0 ? JSON.stringify(meta) : null;
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: updateData,
    });

    await logAudit(
      AUDIT_ACTIONS.PROMOTION_UPDATED,
      null, null, session.user.role, session.user.name,
      `Promotion "${promotion.code}" updated`,
      session.user.email,
    );

    try {
      const updatedMeta = promotion.metadata ? JSON.parse(promotion.metadata) : {};
      await createInvoiceForPromotion(
        {
          code: promotion.code,
          productType: promotion.productType as PromotionProductType,
          appliesTo: promotion.appliesTo,
          targetPlan: promotion.targetPlan,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          maxUses: promotion.maxUses,
          fromPlan: updatedMeta.fromPlan,
          toPlan: updatedMeta.toPlan,
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

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await requireApiPermission("Manage Billing");
    const { id } = await context.params;
    const existing = await getPromotion(id);

    await prisma.promotion.delete({ where: { id } });

    await logAudit(
      AUDIT_ACTIONS.PROMOTION_DELETED,
      null, null, session.user.role, session.user.name,
      `Promotion "${existing.code}" deleted`,
      session.user.email,
    );

    return Response.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
