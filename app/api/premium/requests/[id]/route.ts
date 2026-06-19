import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireApiPermission("premium.requests.view");
    const request = await prisma.premiumRequest.findUnique({
      where: { id },
      include: {
        license: { select: { organization: true, key: true, plan: true, status: true } },
      },
    });
    if (!request) return Response.json({ error: "Premium request not found" }, { status: 404 });
    return Response.json(request);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireApiPermission("premium.requests.approve");
    const { requestedPlan, requestedDurationDays, reason, notes } = await req.json();

    const existing = await prisma.premiumRequest.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Premium request not found" }, { status: 404 });

    if (existing.status !== "PENDING") {
      return Response.json({ error: "Can only modify pending requests" }, { status: 409 });
    }

    const updated = await prisma.premiumRequest.update({
      where: { id },
      data: {
        ...(requestedPlan && { requestedPlan }),
        ...(requestedDurationDays && { requestedDurationDays: Number(requestedDurationDays) }),
        ...(reason !== undefined && { reason }),
        ...(notes !== undefined && { notes }),
      },
    });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_REQUEST_MODIFIED,
      updated.licenseId,
      updated.organization || undefined,
      session.user.role,
      session.user.name,
      `Premium request ${id} modified`,
      session.user.email
    );

    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await requireApiPermission("premium.requests.reject");
    const existing = await prisma.premiumRequest.findUnique({ where: { id } });
    if (!existing) return Response.json({ error: "Premium request not found" }, { status: 404 });

    await prisma.premiumRequest.delete({ where: { id } });

    await logAudit(
      AUDIT_ACTIONS.PREMIUM_REQUEST_REJECTED,
      existing.licenseId,
      existing.organization || undefined,
      session.user.role,
      session.user.name,
      `Premium request ${id} deleted`,
      session.user.email
    );

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
