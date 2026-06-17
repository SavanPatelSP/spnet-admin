import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Grant Gems");
    const { licenseId, amount, rewardId, reason, description } = await req.json();

    if (!licenseId || !amount || amount < 1) {
      return Response.json({ error: "licenseId and amount (positive integer) are required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    let rewardRelation = null;
    if (rewardId) {
      rewardRelation = await prisma.gemReward.findUnique({ where: { id: rewardId } });
      if (!rewardRelation || !rewardRelation.active) {
        return Response.json({ error: "Reward not found or inactive" }, { status: 404 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.gemBalance.upsert({
        where: { licenseId },
        create: { licenseId, balance: amount },
        update: { balance: { increment: amount } },
      });

      const transaction = await tx.gemTransaction.create({
        data: {
          licenseId,
          type: rewardId ? "REWARD" : "GRANT",
          amount,
          balanceAfter: balance.balance,
          rewardId: rewardId || null,
          reason: reason || (rewardRelation ? rewardRelation.name : "Manual grant"),
          description,
          performedBy: session.user.name,
        },
      });

      return { balance, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.GEMS_GRANTED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Granted ${amount} gems to ${license.organization}${reason ? ` (${reason})` : ""}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    console.error("Gems grant error:", error);
    return Response.json({ error: "Failed to grant gems" }, { status: 500 });
  }
}
