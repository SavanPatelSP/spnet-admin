import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Remove Coins");
    const { licenseId, amount, reason, description } = await req.json();

    if (!licenseId || !amount || amount < 1) {
      return Response.json({ error: "licenseId and amount (positive integer) are required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const balance = await prisma.coinBalance.findUnique({ where: { licenseId } });
    if (!balance || balance.balance < amount) {
      return Response.json({ error: "Insufficient coin balance" }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.coinBalance.update({
        where: { licenseId },
        data: { balance: { decrement: amount } },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          licenseId,
          type: "DEBIT",
          amount: -amount,
          balanceAfter: updated.balance,
          reason: reason || "Manual debit",
          description,
          performedBy: session.user.name,
        },
      });

      return { balance: updated, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.COINS_REMOVED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Removed ${amount} coins from ${license.organization}${reason ? ` (${reason})` : ""}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    console.error("Coins remove error:", error);
    return Response.json({ error: "Failed to remove coins" }, { status: 500 });
  }
}
