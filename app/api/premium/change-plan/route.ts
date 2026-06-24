import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { PREMIUM_PLANS, SUBSCRIPTION_TYPES, AUDIT_ACTIONS, PLAN_PRICES, PLAN_TIERS } from "@/lib/constants";
import { createInvoiceForPremiumAction } from "@/lib/invoices";
import { approvalGuard } from "@/lib/approval-guard";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Change Premium Plan");
    const body = await req.json();
    const { licenseId, newPlan, newSubscriptionType, notes } = body;

    if (!licenseId) {
      return Response.json({ error: "licenseId is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    if (!PREMIUM_PLANS.includes(license.plan as never)) {
      return Response.json({ error: "License is not on a premium plan" }, { status: 409 });
    }

    const latestSubscription = await prisma.premiumSubscription.findFirst({
      where: { licenseId, action: { in: ["GRANTED", "EXTENDED", "RENEWED", "PLAN_CHANGED"] } },
      orderBy: { createdAt: "desc" },
    });

    const planChanged = newPlan && newPlan !== license.plan;
    const typeChanged = newSubscriptionType && latestSubscription && newSubscriptionType !== latestSubscription.subscriptionType;

    if (!planChanged && !typeChanged) {
      return Response.json({ error: "No changes detected. Must change plan or subscription type." }, { status: 409 });
    }

    if (planChanged) {
      if (!PREMIUM_PLANS.includes(newPlan as never)) {
        return Response.json({ error: `Invalid premium plan. Must be one of: ${PREMIUM_PLANS.join(", ")}` }, { status: 400 });
      }
    }

    if (typeChanged) {
      if (!SUBSCRIPTION_TYPES.includes(newSubscriptionType as never)) {
        return Response.json({ error: `Invalid subscription type. Must be one of: ${SUBSCRIPTION_TYPES.join(", ")}` }, { status: 400 });
      }
    }

    const guard = await approvalGuard(session, {
      workflowType: "PREMIUM_CHANGE_PLAN",
      title: `Change Premium Plan for ${license.organization}`,
      target: license.organization,
      reason: notes || body.reason || "Change premium plan",
      payload: body as Record<string, unknown>,
      requesterId: session.user.id, requesterName: session.user.name, requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    const finalPlan = planChanged ? newPlan : license.plan;
    const finalType = typeChanged ? newSubscriptionType : (latestSubscription?.subscriptionType || "MONTHLY");

    const currentIndex = PLAN_TIERS.indexOf(license.plan as never);
    const targetIndex = PLAN_TIERS.indexOf(finalPlan as never);
    const direction = planChanged ? (targetIndex > currentIndex ? "UPGRADE" : "DOWNGRADE") : "CHANGE_PLAN";

    const changes: string[] = [];
    if (planChanged) changes.push(`plan: ${license.plan} → ${newPlan}`);
    if (typeChanged) changes.push(`type: ${latestSubscription?.subscriptionType} → ${newSubscriptionType}`);

    const subscription = await prisma.premiumSubscription.create({
      data: {
        licenseId,
        plan: finalPlan,
        subscriptionType: finalType,
        action: direction === "UPGRADE" ? "UPGRADED" : direction === "DOWNGRADE" ? "DOWNGRADED" : "PLAN_CHANGED",
        startDate: new Date(),
        endDate: license.expiresAt,
        grantedBy: session.user.name,
        notes: notes || null,
        previousPlan: license.plan,
        previousEndDate: license.expiresAt,
      },
    });

    if (planChanged) {
      await prisma.license.update({
        where: { id: licenseId },
        data: { plan: finalPlan },
      });
    }

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_PLAN_CHANGED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Changed premium for ${license.organization}: ${changes.join(", ")}`,
      session.user.email
    );

    try {
      const currentPrice = PLAN_PRICES[license.plan] || 0;
      const targetPrice = PLAN_PRICES[finalPlan] || 0;
      const price = targetPrice - currentPrice;
      if (price !== 0) {
        await createInvoiceForPremiumAction(
          licenseId,
          direction,
          finalPlan,
          Math.abs(price),
          subscription.id,
        );
      }
    } catch {
      // Invoice generation is best-effort.
    }

    return Response.json(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}
