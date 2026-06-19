import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Add Coins");
    const { licenseIds, amount, reason, description } = await req.json();

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

    const results = await prisma.$transaction(async (tx) => {
      const items = [];
      for (const license of licenses) {
        const balance = await tx.coinBalance.upsert({
          where: { licenseId: license.id },
          create: { licenseId: license.id, balance: amount },
          update: { balance: { increment: amount } },
        });

        const transaction = await tx.coinTransaction.create({
          data: {
            licenseId: license.id,
            type: "CREDIT",
            amount,
            balanceAfter: balance.balance,
            reason: reason || "Bulk credit",
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
        AUDIT_ACTIONS.COINS_ADDED,
        r.licenseId,
        r.organization,
        session.user.role,
        session.user.name,
        `Bulk added ${amount} coins to ${r.organization}${reason ? ` (${reason})` : ""}`,
        session.user.email
      );
    }

    return Response.json({ count: results.length, results });
  } catch (error) {
    return handleApiError(error);
  }
}
