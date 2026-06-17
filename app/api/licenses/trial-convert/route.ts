import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { parseExpiryDate } from "@/lib/shared";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Manage Trials");
    const body = await req.json();
    const { licenseId, newPlan, newExpiresAt } = body;

    if (!licenseId) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    if (!newPlan?.trim()) {
      return Response.json({ error: "New plan is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const expiryDate = newExpiresAt
      ? parseExpiryDate(newExpiresAt)
      : new Date(2027, 11, 31, 12, 0, 0);

    const updated = await prisma.license.update({
      where: { id: licenseId },
      data: {
        trialStartDate: null,
        trialEndDate: null,
        plan: newPlan,
        expiresAt: expiryDate,
      },
    });

    await prisma.licenseEvent.create({
      data: {
        licenseId,
        type: "TRIAL_CONVERTED",
        description: `Trial converted to ${newPlan}`,
        metadata: JSON.stringify({ newPlan, newExpiresAt: expiryDate.toISOString() }),
        performedBy: session.user.name,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_TRIAL_CONVERTED,
      licenseId,
      license.organization,
      session.user.role,
      session.user.name,
      `Converted trial to ${newPlan} for ${license.organization}`
    );

    return Response.json(updated);
  } catch (error) {
    console.error("Trial convert error:", error);
    return Response.json({ error: "Failed to convert trial" }, { status: 500 });
  }
}
