import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Refund Coins");
    const { transactionId, description } = await req.json();

    if (!transactionId) {
      return Response.json({ error: "transactionId is required" }, { status: 400 });
    }

    const original = await prisma.coinTransaction.findUnique({ where: { id: transactionId } });
    if (!original) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (original.type === "REFUND") {
      return Response.json({ error: "Cannot refund a refund transaction" }, { status: 409 });
    }

    const refundAmount = Math.abs(original.amount);

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.coinBalance.upsert({
        where: { licenseId: original.licenseId },
        create: { licenseId: original.licenseId, balance: refundAmount },
        update: { balance: { increment: refundAmount } },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          licenseId: original.licenseId,
          type: "REFUND",
          amount: refundAmount,
          balanceAfter: balance.balance,
          reason: `Refund of ${original.type} transaction ${original.id}`,
          description,
          performedBy: session.user.name,
          metadata: JSON.stringify({ originalTransactionId: transactionId }),
        },
      });

      return { balance, transaction };
    });

    const license = await prisma.license.findUnique({ where: { id: original.licenseId } });

    await logAudit(
      AUDIT_ACTIONS.COINS_REFUNDED,
      original.licenseId,
      license?.organization,
      session.user.role,
      session.user.name,
      `Refunded ${refundAmount} coins (transaction ${transactionId})`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    console.error("Coins refund error:", error);
    return Response.json({ error: "Failed to process refund" }, { status: 500 });
  }
}
