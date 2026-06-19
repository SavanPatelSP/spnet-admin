import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError, ForbiddenError, ValidationError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, AUTH, SESSION_EXTENSION_PRICE_PER_MINUTE } from "@/lib/constants";
import { createInvoice } from "@/lib/invoices";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["OWNER", "SUPER_ADMIN"];

const OPTION_MINUTES: Record<string, number> = {
  "12h": 720,
  "24h": 1440,
  "7d": 10080,
  "30d": 43200,
};

const UNLIMITED_COST = 100;

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Manage Sessions");
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      throw new ForbiddenError("Only Owner or Super Admin can override session policy");
    }

    const body = await req.json();
    const { sessionId, option, customMinutes, customCooldown } = body;

    if (!sessionId) throw new ValidationError("Session ID is required");
    if (!option || !["unlimited", "12h", "24h", "7d", "30d", "custom", "restore"].includes(option)) {
      throw new ValidationError("Invalid override option");
    }

    const existing = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { teamMember: { select: { email: true, name: true } } },
    });
    if (!existing) return Response.json({ success: false, error: "Session not found" }, { status: 404 });

    let newExpiry: Date;
    let policyLabel: string;
    let cost = 0;

    if (option === "restore") {
      newExpiry = new Date(existing.createdAt.getTime() + AUTH.SESSION_MAX_AGE_SECONDS * 1000);
      policyLabel = "Default Policy";
    } else if (option === "unlimited") {
      newExpiry = new Date("2099-12-31T23:59:59.999Z");
      policyLabel = "Unlimited Session";
      cost = UNLIMITED_COST;
    } else {
      const minutes = option === "custom" ? Math.max(1, Number(customMinutes) || 1) : OPTION_MINUTES[option];
      newExpiry = new Date(Date.now() + minutes * 60 * 1000);
      policyLabel = option === "custom" ? `Custom (${minutes} min)` : option;
      cost = (SESSION_EXTENSION_PRICE_PER_MINUTE || 0) * minutes;
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: {
        expiresAt: newExpiry,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.SESSION_POLICY_OVERRIDDEN,
      null,
      null,
      session.user.role,
      session.user.name,
      `Session policy overridden for ${existing.teamMember?.email || sessionId}: ${policyLabel} until ${newExpiry.toISOString()}`,
      session.user.email,
    );

    if (cost > 0) {
      try {
        await createInvoice({
          organization: existing.teamMember?.name || undefined,
          customerName: existing.teamMember?.name || undefined,
          customerEmail: existing.teamMember?.email || undefined,
          category: "SESSION",
          action: "POLICY_OVERRIDE",
          status: "PENDING",
          type: "SALE",
          subtotal: cost,
          lineItems: [
            {
              description: `Session policy override — ${policyLabel}`,
              quantity: 1,
              unitPrice: Math.round(cost * 100),
              total: Math.round(cost * 100),
            },
          ],
          dueDays: 30,
          notes: `Auto-generated invoice for overriding session policy (${option}).${customCooldown ? ` Cooldown: ${customCooldown} minutes.` : ""}`,
          relatedEntityType: "SESSION_POLICY_OVERRIDE",
          relatedEntityId: sessionId,
        });
      } catch {
        // Invoice generation is best-effort.
      }
    }

    return Response.json({ success: true, session: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
