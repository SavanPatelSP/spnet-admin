import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Grant Gems");
    const { licenseIds, amount, rewardId, reason, description } = await req.json();

    if (!licenseIds || !Array.isArray(licenseIds) || licenseIds.length === 0) {
      return Response.json({ error: "licenseIds (non-empty array) is required" }, { status: 400 });
    }
    if (!amount || amount < 1) {
      return Response.json({ error: "amount (positive integer) is required" }, { status: 400 });
    }

    const licenses = await prisma.license.findMany({
      where: { id: { in: licenseIds } },
    });

    if (licenses.length !== licenseIds.length) {
      return Response.json({ error: "One or more licenses not found" }, { status: 404 });
    }

    let rewardRelation = null;
    if (rewardId) {
      rewardRelation = await prisma.gemReward.findUnique({ where: { id: rewardId } });
      if (!rewardRelation || !rewardRelation.active) {
        return Response.json({ error: "Reward not found or inactive" }, { status: 404 });
      }
    }

    const results = await prisma.$transaction(async (tx) => {
      const items = [];
      for (const license of licenses) {
        const balance = await tx.gemBalance.upsert({
          where: { licenseId: license.id },
          create: { licenseId: license.id, balance: amount },
          update: { balance: { increment: amount } },
        });

        const transaction = await tx.gemTransaction.create({
          data: {
            licenseId: license.id,
            type: rewardId ? "REWARD" : "GRANT",
            amount,
            balanceAfter: balance.balance,
            rewardId: rewardId || null,
            reason: reason || (rewardRelation ? rewardRelation.name : "Bulk grant"),
            description,
            performedBy: session.user.name,
          },
        });

        items.push({ licenseId: license.id, organization: license.organization, balance, transaction });
      }
      return items;
    });

    for (const r of results) {
      await logAudit(
        AUDIT_ACTIONS.GEMS_GRANTED,
        r.licenseId,
        r.organization,
        session.user.role,
        session.user.name,
        `Bulk granted ${amount} gems to ${r.organization}${reason ? ` (${reason})` : ""}`,
        session.user.email
      );
    }

    return Response.json({ count: results.length, results });
  } catch (error) {
    console.error("Gems bulk grant error:", error);
    return Response.json({ error: "Failed to grant gems" }, { status: 500 });
  }
}
