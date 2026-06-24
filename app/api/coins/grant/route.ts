import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";
import { getCoinPackage } from "@/lib/economy-pricing";
import { createInvoice } from "@/lib/invoices";
import { approvalGuard } from "@/lib/approval-guard";

const COIN_TYPES = ["FINITE", "PROMOTIONAL", "BONUS"];

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("coins.grant");
    const body = await req.json();
    const { licenseId, amount, type, reason, description } = body;

    if (!licenseId || !amount || amount < 1) {
      return Response.json({ error: "licenseId and amount (positive integer) are required" }, { status: 400 });
    }

    if (type && !COIN_TYPES.includes(type)) {
      return Response.json({ error: `Invalid coin type. Must be one of: ${COIN_TYPES.join(", ")}` }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const guard = await approvalGuard(session, {
      workflowType: "COINS_GRANT",
      title: `Grant Coins to ${license.organization}`,
      target: license.organization,
      reason: reason || body.reason || "Grant coins",
      payload: body as Record<string, unknown>,
      requesterId: session.user.id, requesterName: session.user.name, requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.coinBalance.upsert({
        where: { licenseId },
        create: { licenseId, balance: amount, type: type || "FINITE" },
        update: {
          balance: { increment: amount },
          ...(type ? { type } : {}),
        },
      });

      const transaction = await tx.coinTransaction.create({
        data: {
          licenseId,
          type: "CREDIT",
          amount,
          balanceAfter: balance.balance,
          reason: reason || `Granted coins${type ? ` (${type})` : ""}`,
          description,
          performedBy: session.user.name,
        },
      });

      return { balance, transaction };
    });

    await logAudit(
      AUDIT_ACTIONS.COINS_BULK_GRANTED,
      license.id,
      license.organization,
      session.user.role,
      session.user.name,
      `Granted ${amount} coins${type ? ` (${type})` : ""} to ${license.organization}${reason ? ` (${reason})` : ""}`,
      session.user.email
    );

    try {
      const coinPkg = getCoinPackage(type || "STARTER");
      const price = coinPkg ? (amount / coinPkg.amount) * coinPkg.price : 0;
      if (price > 0) {
        await createInvoice({
          licenseId,
          category: "COIN",
          action: "GRANT",
          status: "PENDING",
          type: "SALE",
          subtotal: price,
          lineItems: [
            { description: `Coins grant — ${amount} coins${type ? ` (${type})` : ""}`, quantity: 1, unitPrice: Math.round(price * 100), total: Math.round(price * 100) },
          ],
          dueDays: 30,
          notes: `Auto-generated invoice for granting ${amount} coins. ${reason || ""}`.trim(),
          relatedEntityType: "COIN_GRANT",
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
