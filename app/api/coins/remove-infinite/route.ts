import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("coins.remove-infinite");
    const { licenseId } = await req.json();

    if (!licenseId) {
      return Response.json({ error: "licenseId is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const balance = await prisma.coinBalance.findUnique({ where: { licenseId } });
    if (!balance) {
      return Response.json({ error: "Coin balance not found" }, { status: 404 });
    }
    if (!balance.isInfinite) {
      return Response.json({ error: "Coin balance is not infinite" }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.coinBalance.update({
        where: { licenseId },
        data: { isInfinite: false },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          licenseId,
          type: "ADJUSTMENT",
          amount: 0,
          balanceAfter: updated.balance,
          reason: "Removed infinite coins",
          performedBy: session.user.name,
        },
      });

      return { balance: updated, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.COINS_INFINITE_REMOVED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Removed infinite coins for ${license.organization}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    console.error("Coins remove-infinite error:", error);
    return Response.json({ error: "Failed to remove infinite coins" }, { status: 500 });
  }
}
