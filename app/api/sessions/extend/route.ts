import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, SESSION_EXTENSION_PRICE_PER_MINUTE } from "@/lib/constants";
import { createInvoice } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Manage Sessions");
    const body = await req.json();
    const { sessionId, minutes } = body;

    if (!sessionId) {
      return Response.json({ success: false, error: "Session ID is required" }, { status: 400 });
    }

    const extendMinutes = Math.min(240, Math.max(1, Number(minutes) || 60));
    const existing = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { teamMember: { select: { email: true, name: true } } },
    });

    if (!existing) {
      return Response.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const baseExpiry = existing.expiresAt > new Date() ? existing.expiresAt : new Date();
    const newExpiry = new Date(baseExpiry.getTime() + extendMinutes * 60 * 1000);
    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt: newExpiry },
    });

    await logAudit(
      AUDIT_ACTIONS.SESSION_EXTENDED,
      null,
      null,
      session.user.role,
      session.user.name,
      `Session extended for ${existing.teamMember?.email || sessionId} until ${newExpiry.toISOString()}`,
      session.user.email,
    );

    const pricePerMinute = SESSION_EXTENSION_PRICE_PER_MINUTE || 0;
    const totalCost = pricePerMinute * extendMinutes;
    if (totalCost > 0) {
      try {
        await createInvoice({
          licenseId: undefined,
          organization: existing.teamMember?.name || undefined,
          customerName: existing.teamMember?.name || undefined,
          customerEmail: existing.teamMember?.email || undefined,
          status: "PENDING",
          type: "SALE",
          category: "SESSION",
          action: "EXTEND",
          subtotal: totalCost,
          lineItems: [
            {
              description: `Session extension — ${extendMinutes} minutes`,
              quantity: extendMinutes,
              unitPrice: Math.round(pricePerMinute * 100),
              total: Math.round(totalCost * 100),
            },
          ],
          dueDays: 30,
          notes: `Auto-generated invoice for extending session ${sessionId} by ${extendMinutes} minutes.`,
          relatedEntityType: "SESSION_EXTEND",
          relatedEntityId: sessionId,
        });
      } catch {
        // Invoice generation is best-effort; do not fail the extension.
      }
    }

    return Response.json({ success: true, session: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
