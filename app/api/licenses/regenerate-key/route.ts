import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { generateKey } from "@/lib/shared";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { approvalGuard } from "@/lib/approval-guard";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Regenerate License Keys");
    const body = await req.json();

    if (!body.id) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }
    const license = await prisma.license.findUnique({ where: { id: body.id } });

    const guard = await approvalGuard(session, {
      workflowType: "REGENERATE_KEY",
      title: `Regenerate License Key for ${license?.organization || "unknown"}`,
      target: license?.organization || "unknown",
      reason: body.reason || "Regenerate license key",
      payload: body as Record<string, unknown>,
      requesterId: session.user.id,
      requesterName: session.user.name,
      requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const newKey = generateKey();
    const updated = await prisma.license.update({
      where: { id: body.id },
      data: { key: newKey },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_KEY_REGENERATED,
      updated.id,
      updated.organization,
      session.user.role,
      session.user.name,
      `Regenerated license key for ${updated.organization}`
    );

    return Response.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
