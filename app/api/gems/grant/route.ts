import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { getGemPackage } from "@/lib/economy-pricing";
import { createInvoice } from "@/lib/invoices";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Grant Gems");
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

    try {
      const gemPkg = getGemPackage(amount);
      const price = gemPkg ? gemPkg.price : 0;
      if (price > 0) {
        await createInvoice({
          licenseId,
          category: "GEM",
          action: "GRANT",
          status: "PENDING",
          type: "SALE",
          subtotal: price,
          lineItems: [
            { description: `Gems grant — ${amount} gems${rewardRelation ? ` (reward: ${rewardRelation.name})` : ""}`, quantity: 1, unitPrice: Math.round(price * 100), total: Math.round(price * 100) },
          ],
          dueDays: 30,
          notes: `Auto-generated invoice for granting ${amount} gems. ${reason || ""}`.trim(),
          relatedEntityType: "GEM_GRANT",
          relatedEntityId: licenseId,
        });
      }
    } catch {
      // Invoice generation is best-effort.
    }

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
