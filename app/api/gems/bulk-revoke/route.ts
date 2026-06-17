import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Revoke Gems");
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
        const balance = await tx.gemBalance.findUnique({ where: { licenseId: license.id } });
        if (!balance || balance.balance < amount) {
          items.push({ licenseId: license.id, organization: license.organization, error: "Insufficient balance", skipped: true });
          continue;
        }

        const updated = await tx.gemBalance.update({
          where: { licenseId: license.id },
          data: { balance: { decrement: amount } },
        });

        const transaction = await tx.gemTransaction.create({
          data: {
            licenseId: license.id,
            type: "REVOKE",
            amount: -amount,
            balanceAfter: updated.balance,
            reason: reason || "Bulk revoke",
            description,
            performedBy: session.user.name,
          },
        });

        items.push({ licenseId: license.id, organization: license.organization, balance: updated, transaction, skipped: false });

        await logAudit(
          AUDIT_ACTIONS.GEMS_REVOKED,
          license.id,
          license.organization,
          session.user.role,
          session.user.name,
          `Bulk revoked ${amount} gems from ${license.organization}${reason ? ` (${reason})` : ""}`,
          session.user.email
        );
      }
      return items;
    });

    return Response.json({ count: results.filter((r) => !r.skipped).length, skipped: results.filter((r) => r.skipped).length, results });
  } catch (error) {
    console.error("Gems bulk revoke error:", error);
    return Response.json({ error: "Failed to revoke gems" }, { status: 500 });
  }
}
