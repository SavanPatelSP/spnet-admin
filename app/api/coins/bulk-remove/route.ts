import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Remove Coins");
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
        const balance = await tx.coinBalance.findUnique({ where: { licenseId: license.id } });
        if (!balance || balance.balance < amount) {
          items.push({ licenseId: license.id, organization: license.organization, error: "Insufficient balance", skipped: true });
          continue;
        }

        const updated = await tx.coinBalance.update({
          where: { licenseId: license.id },
          data: { balance: { decrement: amount } },
        });

        const transaction = await tx.coinTransaction.create({
          data: {
            licenseId: license.id,
            type: "DEBIT",
            amount: -amount,
            balanceAfter: updated.balance,
            reason: reason || "Bulk debit",
            description,
            performedBy: session.user.name,
          },
        });

        items.push({ licenseId: license.id, organization: license.organization, balance: updated, transaction, skipped: false });

        await logAudit(
          AUDIT_ACTIONS.COINS_REMOVED,
          license.id,
          license.organization,
          session.user.role,
          session.user.name,
          `Bulk removed ${amount} coins from ${license.organization}${reason ? ` (${reason})` : ""}`,
          session.user.email
        );
      }
      return items;
    });

    return Response.json({ count: results.filter((r) => !r.skipped).length, skipped: results.filter((r) => r.skipped).length, results });
  } catch (error) {
    return handleApiError(error);
  }
}
