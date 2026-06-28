import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { PREMIUM_PLANS, AUDIT_ACTIONS, PLAN_PRICES } from "@/lib/constants";
import { createInvoiceForPremiumAction } from "@/lib/invoices";
import { approvalGuard } from "@/lib/approval-guard";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("premium.convert-custom");
    const body = await req.json();
    const { licenseId, plan, durationDays, startDate: customStartDate, notes } = body;

    if (!licenseId || !plan || !durationDays) {
      return Response.json({ error: "licenseId, plan, and durationDays are required" }, { status: 400 });
    }

    if (!PREMIUM_PLANS.some(p => p === plan)) {
      return Response.json({ error: `Invalid plan. Must be one of: ${PREMIUM_PLANS.join(", ")}` }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) return Response.json({ error: "License not found" }, { status: 404 });

    if (!PREMIUM_PLANS.some(p => p === license.plan)) {
      return Response.json({ error: "License is not on a premium plan" }, { status: 409 });
    }

    const startDate = customStartDate ? new Date(customStartDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(durationDays));

    const guard = await approvalGuard(session, {
      workflowType: "PREMIUM_CONVERT_CUSTOM",
      title: `Convert to Custom Premium for ${license.organization}`,
      target: license.organization,
      reason: notes || body.reason || "Convert to custom premium",
      payload: body as Record<string, unknown>,
      requesterId: session.user.id, requesterName: session.user.name, requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.premiumSubscription.create({
        data: {
          licenseId,
          plan,
          subscriptionType: "CUSTOM",
          action: "CONVERTED_TO_CUSTOM",
          startDate,
          endDate,
          durationDays: Number(durationDays),
          grantedBy: session.user.name,
          notes: notes || null,
          previousPlan: license.plan,
          previousEndDate: license.expiresAt,
        },
      });

      await tx.license.update({
        where: { id: licenseId },
        data: { plan, expiresAt: endDate },
      });

      return subscription;
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_CONVERTED_TO_CUSTOM,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Converted ${license.organization} premium to custom: ${plan} (${durationDays} days)`,
      session.user.email
    );

    try {
      const planPrice = PLAN_PRICES[plan] || 0;
      const price = planPrice > 0 ? (planPrice / 30) * Number(durationDays) : 0;
      if (price > 0) {
        await createInvoiceForPremiumAction(licenseId, "CONVERTED_TO_CUSTOM", plan, price, result.id);
      }
    } catch {
      // Invoice generation is best-effort.
    }

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
