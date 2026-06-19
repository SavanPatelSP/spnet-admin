import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { PREMIUM_PLANS, AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("premium.convert-lifetime");
    const { licenseId, notes } = await req.json();

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

    if (latestSubscription?.subscriptionType === "LIFETIME") {
      return Response.json({ error: "Subscription is already lifetime" }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const endDate = new Date("2099-12-31");

      const subscription = await tx.premiumSubscription.create({
        data: {
          licenseId,
          plan: license.plan,
          subscriptionType: "LIFETIME",
          action: "CONVERTED_TO_LIFETIME",
          startDate: new Date(),
          endDate,
          durationDays: null,
          grantedBy: session.user.name,
          notes: notes || null,
          previousPlan: latestSubscription?.plan || null,
          previousEndDate: latestSubscription?.endDate || null,
        },
      });

      await tx.license.update({
        where: { id: licenseId },
        data: { expiresAt: endDate },
      });

      return subscription;
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_LIFETIME_CONVERTED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Converted ${license.organization} premium to lifetime`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
