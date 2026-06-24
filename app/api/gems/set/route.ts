import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { approvalGuard } from "@/lib/approval-guard";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("gems.set");
    const body = await req.json();
    const { licenseId, balance, type, reason, description } = body;

    if (!licenseId || balance === undefined || balance < 0) {
      return Response.json({ error: "licenseId and balance (non-negative integer) are required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const guard = await approvalGuard(session, {
      workflowType: "GEMS_SET",
      title: `Set Gems for ${license.organization}`,
      target: license.organization,
      reason: reason || body.reason || "Set gem balance",
      payload: body as Record<string, unknown>,
      requesterId: session.user.id, requesterName: session.user.name, requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.gemBalance.findUnique({ where: { licenseId } });

      const updated = await tx.gemBalance.upsert({
        where: { licenseId },
        create: {
          licenseId,
          balance,
          type: type || "FINITE",
        },
        update: {
          balance,
          type: type || undefined,
        },
      });

      const transaction = await tx.gemTransaction.create({
        data: {
          licenseId,
          type: "ADJUSTMENT",
          amount: balance - (previous?.balance || 0),
          balanceAfter: updated.balance,
          reason: reason || "Manual balance set",
          description,
          performedBy: session.user.name,
        },
      });

      return { previous: previous?.balance || 0, balance: updated, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.GEMS_SET,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Set ${license.organization} gem balance to ${balance}${reason ? ` (${reason})` : ""}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
