import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { PREMIUM_PLANS, AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Extend Premium");
    const { licenseId, additionalDays, notes } = await req.json();

    if (!licenseId || !additionalDays) {
      return Response.json({ error: "licenseId and additionalDays are required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    if (!PREMIUM_PLANS.includes(license.plan as never)) {
      return Response.json({ error: "License is not on a premium plan" }, { status: 409 });
    }

    const newEndDate = new Date(license.expiresAt);
    newEndDate.setDate(newEndDate.getDate() + Number(additionalDays));

    const subscription = await prisma.premiumSubscription.create({
      data: {
        licenseId,
        plan: license.plan,
        action: "EXTENDED",
        startDate: new Date(),
        endDate: newEndDate,
        durationDays: Number(additionalDays),
        grantedBy: session.user.name,
        notes: notes || null,
        previousPlan: license.plan,
        previousEndDate: license.expiresAt,
      },
    });

    await prisma.license.update({
      where: { id: licenseId },
      data: { expiresAt: newEndDate },
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_EXTENDED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Extended premium for ${license.organization} by ${additionalDays} days`,
      session.user.email
    );

    return Response.json(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}
