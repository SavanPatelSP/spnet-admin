import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { PREMIUM_PLANS, SUBSCRIPTION_TYPES, AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("premium.downgrade");
    const { licenseId, newPlan, newSubscriptionType, notes } = await req.json();

    if (!licenseId || !newPlan) {
      return Response.json({ error: "licenseId and newPlan are required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    if (!PREMIUM_PLANS.includes(license.plan as never)) {
      return Response.json({ error: "License is not on a premium plan" }, { status: 409 });
    }

    if (newPlan === license.plan && !newSubscriptionType) {
      return Response.json({ error: "New plan is the same as current plan" }, { status: 400 });
    }

    const latestSubscription = await prisma.premiumSubscription.findFirst({
      where: { licenseId, action: { in: ["GRANTED", "EXTENDED", "RENEWED", "PLAN_CHANGED"] } },
      orderBy: { createdAt: "desc" },
    });

    const finalType = newSubscriptionType || latestSubscription?.subscriptionType || "MONTHLY";

    if (newSubscriptionType && !SUBSCRIPTION_TYPES.includes(newSubscriptionType as never)) {
      return Response.json({ error: `Invalid subscription type. Must be one of: ${SUBSCRIPTION_TYPES.join(", ")}` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const subscription = await tx.premiumSubscription.create({
        data: {
          licenseId,
          plan: newPlan,
          subscriptionType: finalType,
          action: "DOWNGRADED",
          startDate: new Date(),
          endDate: license.expiresAt,
          durationDays: latestSubscription?.durationDays || null,
          grantedBy: session.user.name,
          notes: notes || null,
          previousPlan: license.plan,
          previousEndDate: latestSubscription?.endDate || null,
        },
      });

      await tx.license.update({
        where: { id: licenseId },
        data: { plan: newPlan },
      });

      return subscription;
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_DOWNGRADED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Downgraded ${license.organization} from ${license.plan} to ${newPlan}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    console.error("Premium downgrade error:", error);
    return Response.json({ error: "Failed to downgrade premium" }, { status: 500 });
  }
}
