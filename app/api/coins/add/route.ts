import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Add Coins");
    const { licenseId, amount, reason, description } = await req.json();

    if (!licenseId || !amount || amount < 1) {
      return Response.json({ error: "licenseId and amount (positive integer) are required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.coinBalance.upsert({
        where: { licenseId },
        create: { licenseId, balance: amount },
        update: { balance: { increment: amount } },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          licenseId,
          type: "CREDIT",
          amount,
          balanceAfter: balance.balance,
          reason: reason || "Manual credit",
          description,
          performedBy: session.user.name,
        },
      });

      return { balance, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.COINS_ADDED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Added ${amount} coins to ${license.organization}${reason ? ` (${reason})` : ""}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
