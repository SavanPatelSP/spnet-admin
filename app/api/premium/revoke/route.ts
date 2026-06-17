import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { PREMIUM_PLANS, AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Revoke Premium");
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

    const subscription = await prisma.premiumSubscription.create({
      data: {
        licenseId,
        plan: license.plan,
        action: "REVOKED",
        startDate: new Date(),
        endDate: new Date(),
        grantedBy: session.user.name,
        notes: notes || null,
        previousPlan: license.plan,
        previousEndDate: license.expiresAt,
      },
    });

    await prisma.license.update({
      where: { id: licenseId },
      data: {
        plan: "FREE",
      },
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_REVOKED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Revoked ${license.plan} premium for ${license.organization}`,
      session.user.email
    );

    return Response.json(subscription);
  } catch (error) {
    console.error("Premium revoke error:", error);
    return Response.json({ error: "Failed to revoke premium" }, { status: 500 });
  }
}
