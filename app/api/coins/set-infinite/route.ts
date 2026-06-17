import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("coins.set-infinite");
    const { licenseId } = await req.json();

    if (!licenseId) {
      return Response.json({ error: "licenseId is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.coinBalance.upsert({
        where: { licenseId },
        create: {
          licenseId,
          balance: 0,
          isInfinite: true,
        },
        update: {
          isInfinite: true,
        },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          licenseId,
          type: "ADJUSTMENT",
          amount: 0,
          balanceAfter: balance.balance,
          reason: "Set infinite coins",
          performedBy: session.user.name,
        },
      });

      return { balance, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.COINS_INFINITE_SET,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Set infinite coins for ${license.organization}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    console.error("Coins set-infinite error:", error);
    return Response.json({ error: "Failed to set infinite coins" }, { status: 500 });
  }
}
