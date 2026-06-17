import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

const COIN_TYPES = ["FINITE", "PROMOTIONAL", "BONUS"];

export async function POST(req: Request) {
  try {
    const session = await requirePermission("coins.grant");
    const { licenseId, amount, type, reason, description } = await req.json();

    if (!licenseId || !amount || amount < 1) {
      return Response.json({ error: "licenseId and amount (positive integer) are required" }, { status: 400 });
    }

    if (type && !COIN_TYPES.includes(type)) {
      return Response.json({ error: `Invalid coin type. Must be one of: ${COIN_TYPES.join(", ")}` }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.coinBalance.upsert({
        where: { licenseId },
        create: { licenseId, balance: amount, type: type || "FINITE" },
        update: {
          balance: { increment: amount },
          ...(type ? { type } : {}),
        },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          licenseId,
          type: "CREDIT",
          amount,
          balanceAfter: balance.balance,
          reason: reason || `Granted coins${type ? ` (${type})` : ""}`,
          description,
          performedBy: session.user.name,
        },
      });

      return { balance, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.COINS_BULK_GRANTED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Granted ${amount} coins${type ? ` (${type})` : ""} to ${license.organization}${reason ? ` (${reason})` : ""}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    console.error("Coins grant error:", error);
    return Response.json({ error: "Failed to grant coins" }, { status: 500 });
  }
}
