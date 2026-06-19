import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { PREMIUM_PLANS, SUBSCRIPTION_TYPES, AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Grant Premium");
    const { licenseId, plan, durationDays, subscriptionType, notes } = await req.json();

    if (!licenseId || !plan) {
      return Response.json({ error: "licenseId and plan are required" }, { status: 400 });
    }

    if (!PREMIUM_PLANS.includes(plan as never)) {
      return Response.json({ error: `Invalid premium plan. Must be one of: ${PREMIUM_PLANS.join(", ")}` }, { status: 400 });
    }

    const subType = subscriptionType || "MONTHLY";
    if (!SUBSCRIPTION_TYPES.includes(subType as never)) {
      return Response.json({ error: `Invalid subscription type. Must be one of: ${SUBSCRIPTION_TYPES.join(", ")}` }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    if (PREMIUM_PLANS.includes(license.plan as never)) {
      return Response.json({ error: "License is already on a premium plan" }, { status: 409 });
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

    return Response.json(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}
