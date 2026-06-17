import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("gems.remove-infinite");
    const { licenseId } = await req.json();

    if (!licenseId) {
      return Response.json({ error: "licenseId is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const balance = await prisma.gemBalance.findUnique({ where: { licenseId } });
    if (!balance) {
      return Response.json({ error: "Gem balance not found" }, { status: 404 });
    }
    if (!balance.isInfinite) {
      return Response.json({ error: "Gem balance is not infinite" }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.gemBalance.update({
        where: { licenseId },
        data: { isInfinite: false },
      });

      const transaction = await tx.gemTransaction.create({
        data: {
          licenseId,
          type: "ADJUSTMENT",
          amount: 0,
          balanceAfter: updated.balance,
          reason: "Removed infinite gems",
          performedBy: session.user.name,
        },
      });

      return { balance: updated, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.GEMS_INFINITE_REMOVED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Removed infinite gems for ${license.organization}`,
      session.user.email
    );

    return Response.json(result);
  } catch (error) {
    console.error("Gems remove-infinite error:", error);
    return Response.json({ error: "Failed to remove infinite gems" }, { status: 500 });
  }
}
