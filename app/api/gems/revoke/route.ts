import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { approvalGuard } from "@/lib/approval-guard";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Revoke Gems");
    const body = await req.json();
    const { licenseId, amount, reason, description } = body;

    if (!licenseId || !amount || amount < 1) {
      return Response.json({ error: "licenseId and amount (positive integer) are required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const balance = await prisma.gemBalance.findUnique({ where: { licenseId } });
    if (!balance || balance.balance < amount) {
      return Response.json({ error: "Insufficient gem balance" }, { status: 409 });
    }

    const guard = await approvalGuard(session, {
      workflowType: "GEMS_REVOKE",
      title: `Revoke Gems from ${license.organization}`,
      target: license.organization,
      reason: reason || body.reason || "Revoke gems",
      payload: body as Record<string, unknown>,
      requesterId: session.user.id, requesterName: session.user.name, requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.gemBalance.update({
        where: { licenseId },
        data: { balance: { decrement: amount } },
      });

      const transaction = await tx.gemTransaction.create({
        data: {
          licenseId,
          type: "REVOKE",
          amount: -amount,
          balanceAfter: updated.balance,
          reason: reason || "Manual revoke",
          description,
          performedBy: session.user.name,
        },
      });

      return { balance: updated, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.GEMS_REVOKED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Revoked ${amount} gems from ${license.organization}${reason ? ` (${reason})` : ""}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
