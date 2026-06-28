import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { PREMIUM_PLANS, ADMIN_SUBSCRIPTION_TYPES, AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("premium.bulk-grant");
    const { licenseIds, plan, durationDays, subscriptionType, notes } = await req.json();

    if (!licenseIds || !Array.isArray(licenseIds) || licenseIds.length === 0) {
      return Response.json({ error: "licenseIds (non-empty array) is required" }, { status: 400 });
    }
    if (!plan) {
      return Response.json({ error: "plan is required" }, { status: 400 });
    }
    if (!PREMIUM_PLANS.some(p => p === plan)) {
      return Response.json({ error: `Invalid premium plan. Must be one of: ${PREMIUM_PLANS.join(", ")}` }, { status: 400 });
    }

    const subType = subscriptionType || "MONTHLY";
    if (!ADMIN_SUBSCRIPTION_TYPES.some(s => s === subType)) {
      return Response.json({ error: `Invalid subscription type. Must be one of: ${ADMIN_SUBSCRIPTION_TYPES.join(", ")}` }, { status: 400 });
    }

    const licenses = await prisma.license.findMany({
      where: { id: { in: licenseIds } },
    });

    if (licenses.length !== licenseIds.length) {
      return Response.json({ error: "One or more licenses not found" }, { status: 404 });
    }

    const results = await prisma.$transaction(async (tx) => {
      const items = [];
      for (const license of licenses) {
        if (PREMIUM_PLANS.some(p => p === license.plan)) {
          items.push({ licenseId: license.id, organization: license.organization, skipped: true, reason: "Already on premium plan" });
          continue;
        }

        const isLifetime = subType === "LIFETIME";
        const startDate = new Date();
        const endDate = isLifetime ? new Date("2099-12-31") : new Date(startDate.getTime() + Number(durationDays || 365) * 86400000);

        const subscription = await tx.premiumSubscription.create({
          data: {
            licenseId: license.id,
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

        await tx.license.update({
          where: { id: license.id },
          data: { plan, expiresAt: endDate },
        });

        items.push({ licenseId: license.id, organization: license.organization, skipped: false, subscription });
      }
      return items;
    });

    for (const r of results) {
      if (r.skipped) continue;
      await logAudit(
        AUDIT_ACTIONS.PREMIUM_BULK_GRANTED,
        r.licenseId,
        r.organization,
        session.user.role,
        session.user.name,
        `Bulk granted ${plan} premium to ${r.organization} (${durationDays} days)`,
        session.user.email
      );
    }

    return Response.json({ count: results.length, results });
  } catch (error) {
    return handleApiError(error);
  }
}
