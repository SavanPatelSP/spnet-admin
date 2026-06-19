import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("coins.set");
    const { licenseId, balance, type, reason, description } = await req.json();

    if (!licenseId || balance === undefined || balance < 0) {
      return Response.json({ error: "licenseId and balance (non-negative integer) are required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
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
