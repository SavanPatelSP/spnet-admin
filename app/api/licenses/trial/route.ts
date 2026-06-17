import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Manage Trials");
    const body = await req.json();
    const { licenseId, trialDays } = body;

    if (!licenseId) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    if (!trialDays || trialDays < 1) {
      return Response.json({ error: "Trial days must be a positive number" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + trialDays * 86400000);

    const updated = await prisma.license.update({
      where: { id: licenseId },
      data: {
        trialStartDate: now,
        trialEndDate: trialEnd,
      },
    });

    await prisma.licenseEvent.create({
      data: {
        licenseId,
        type: "TRIAL_STARTED",
        description: `Trial started for ${trialDays} days`,
        metadata: JSON.stringify({ trialDays, trialEnd: trialEnd.toISOString() }),
        performedBy: session.user.name,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_TRIAL_STARTED,
      licenseId,
      license.organization,
      session.user.role,
      session.user.name,
      `Started ${trialDays}-day trial for ${license.organization}`
    );

    return Response.json(updated);
  } catch (error) {
    console.error("Trial start error:", error);
    return Response.json({ error: "Failed to start trial" }, { status: 500 });
  }
}
