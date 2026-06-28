import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { PREMIUM_PLANS, ADMIN_SUBSCRIPTION_TYPES, AUDIT_ACTIONS, PLAN_PRICES } from "@/lib/constants";
import { createInvoiceForPremium } from "@/lib/invoices";
import { approvalGuard } from "@/lib/approval-guard";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Grant Premium");
    const body = await req.json();
    const { licenseId, plan, durationDays, subscriptionType, notes } = body;

    if (!licenseId || !plan) {
      return Response.json({ error: "licenseId and plan are required" }, { status: 400 });
    }

    if (!PREMIUM_PLANS.some(p => p === plan)) {
      return Response.json({ error: `Invalid premium plan. Must be one of: ${PREMIUM_PLANS.join(", ")}` }, { status: 400 });
    }

    const subType = subscriptionType || "MONTHLY";
    if (!ADMIN_SUBSCRIPTION_TYPES.some(s => s === subType)) {
      return Response.json({ error: `Invalid subscription type. Must be one of: ${ADMIN_SUBSCRIPTION_TYPES.join(", ")}` }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    if (PREMIUM_PLANS.some(p => p === license.plan)) {
      return Response.json({ error: "License is already on a premium plan" }, { status: 409 });
    }

    const guard = await approvalGuard(session, {
      workflowType: "PREMIUM_GRANT",
      title: `Grant Premium to ${license.organization}`,
      target: license.organization,
      reason: notes || body.reason || "Grant premium",
      payload: body as Record<string, unknown>,
      requesterId: session.user.id, requesterName: session.user.name, requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    const isLifetime = subType === "LIFETIME";
    const startDate = new Date();
    const endDate = isLifetime ? new Date("2099-12-31") : new Date(startDate.getTime() + Number(durationDays || 365) * 86400000);

    const subscription = await prisma.premiumSubscription.create({
      data: {
        licenseId,
        plan,
        subscriptionType: subType,
        action: "GRANTED",
        startDate,
        endDate,
        durationDays: isLifetime ? null : Number(durationDays || 365),
        grantedBy: session.user.name,
        notes: notes || null,
        previousPlan: license.plan,
        previousEndDate: license.expiresAt,
      },
    });

    await prisma.license.update({
      where: { id: licenseId },
      data: {
        plan,
        expiresAt: endDate,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_GRANTED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Granted ${plan} premium for ${license.organization} (${subType}${isLifetime ? "" : ", " + (durationDays || 365) + " days"})`,
      session.user.email
    );

    try {
      const price = PLAN_PRICES[plan] ?? 0;
      if (price > 0) {
        await createInvoiceForPremium(licenseId, plan, price, subscription.id);
      }
    } catch {
      // Invoice generation is best-effort; do not fail the grant.
    }

    return Response.json(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}
