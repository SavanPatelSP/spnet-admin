import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { PREMIUM_PLANS, AUDIT_ACTIONS, PREMIUM_REQUEST_STATUSES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const session = await requirePermission("premium.requests.view");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const licenseId = searchParams.get("licenseId");

    const where: Record<string, unknown> = {};
    if (status && PREMIUM_REQUEST_STATUSES.includes(status as never)) where.status = status;
    if (licenseId) where.licenseId = licenseId;

    const requests = await prisma.premiumRequest.findMany({
      where,
      include: {
        license: { select: { organization: true, key: true, plan: true, status: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    return Response.json(requests);
  } catch (error) {
    console.error("Premium requests list error:", error);
    return Response.json({ error: "Failed to fetch premium requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Grant Premium");
    const { licenseId, requestedPlan, requestedDurationDays, reason, notes, organization } = await req.json();

    if (!licenseId || !requestedPlan || !requestedDurationDays) {
      return Response.json({ error: "licenseId, requestedPlan, and requestedDurationDays are required" }, { status: 400 });
    }

    if (!PREMIUM_PLANS.includes(requestedPlan as never)) {
      return Response.json({ error: `Invalid plan. Must be one of: ${PREMIUM_PLANS.join(", ")}` }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const premiumRequest = await prisma.premiumRequest.create({
      data: {
        licenseId,
        organization: organization || license.organization,
        requestedPlan,
        requestedDurationDays: Number(requestedDurationDays),
        reason: reason || null,
        submittedBy: session.user.name,
        notes: notes || null,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_REQUEST_CREATED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Premium request created: ${requestedPlan} for ${license.organization} (${requestedDurationDays} days)`,
      session.user.email
    );

    return Response.json(premiumRequest, { status: 201 });
  } catch (error) {
    console.error("Premium request create error:", error);
    return Response.json({ error: "Failed to create premium request" }, { status: 500 });
  }
}
