import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { approvalGuard } from "@/lib/approval-guard";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("coins.set");
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
      workflowType: "COINS_SET",
      title: `Set Coins for ${license.organization}`,
      target: license.organization,
      reason: reason || body.reason || "Set coin balance",
      payload: body as Record<string, unknown>,
      requesterId: session.user.id, requesterName: session.user.name, requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.coinBalance.findUnique({ where: { licenseId } });

      const updated = await tx.coinBalance.upsert({
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

      const transaction = await tx.coinTransaction.create({
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
      AUDIT_ACTIONS.COINS_SET,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Set ${license.organization} coin balance to ${balance}${reason ? ` (${reason})` : ""}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
