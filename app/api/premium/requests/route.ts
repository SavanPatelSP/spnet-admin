import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { PREMIUM_PLANS, PREMIUM_REQUEST_STATUSES, AUDIT_ACTIONS } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await requireApiPermission("premium.requests.view");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const licenseId = searchParams.get("licenseId");

    const where: Prisma.PremiumRequestWhereInput = {};
    if (status && PREMIUM_REQUEST_STATUSES.some(s => s === status)) where.status = status;
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
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Grant Premium");
    const { licenseId, requestedPlan, requestedDurationDays, reason, notes, organization } = await req.json();

    if (!licenseId || !requestedPlan || !requestedDurationDays) {
      return Response.json({ error: "licenseId, requestedPlan, and requestedDurationDays are required" }, { status: 400 });
    }

    if (!PREMIUM_PLANS.some(p => p === requestedPlan)) {
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
    return handleApiError(error);
  }
}
