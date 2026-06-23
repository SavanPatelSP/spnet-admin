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
    const apiSession = await requireApiPermission("Manage Sessions");
    if (!ALLOWED_ROLES.includes(apiSession.user.role)) {
      throw new ForbiddenError("Only Owner or Super Admin can override session policy");
    }

    const body = await req.json();
    const { sessionId, option, customMinutes, customCooldown, cooldownOnly, cooldownOption } = body;

    if (!sessionId) throw new ValidationError("Session ID is required");

    if (cooldownOnly) {
      // Cooldown-only override — does not change session duration
      if (!cooldownOption || !["0min", "5min", "10min", "30min", "1h", "custom", "restore"].includes(cooldownOption)) {
        throw new ValidationError("Invalid cooldown option");
      }

      const existing = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { teamMember: { select: { email: true, name: true } } },
      });
      if (!existing) return Response.json({ success: false, error: "Session not found" }, { status: 404 });

      const effectiveCooldown = cooldownOption === "restore" ? null : Math.max(0, Number(customCooldown) || 0);

      const updated = await prisma.session.update({
        where: { id: sessionId },
        data: {
          overrideCooldownMinutes: cooldownOption === "restore" ? null : effectiveCooldown,
          lastOverrideAt: new Date(),
        },
      });

      const auditEntry = await logAudit(
        AUDIT_ACTIONS.LOGIN_TENURE_OVERRIDDEN,
        null,
        null,
        apiSession.user.role,
        apiSession.user.name,
        `Login tenure overridden for ${existing.teamMember?.email || sessionId}: cooldown ${effectiveCooldown !== null ? `${effectiveCooldown} min` : "restored to default"}`,
        apiSession.user.email,
      );

      const cost = (SESSION_EXTENSION_PRICE_PER_MINUTE || 0) * (effectiveCooldown || 0);
      let invoiceId: string | null = null;
      if (cost > 0) {
        try {
          const invoice = await createInvoice({
            organization: existing.teamMember?.name || undefined,
            customerName: existing.teamMember?.name || undefined,
            customerEmail: existing.teamMember?.email || undefined,
            category: "SESSION",
            action: "LOGIN_TENURE_OVERRIDE",
            status: "PENDING",
            type: "SALE",
            subtotal: cost,
            lineItems: [
              {
                description: `Login tenure override — cooldown ${effectiveCooldown} minutes`,
                quantity: 1,
                unitPrice: Math.round(cost * 100),
                total: Math.round(cost * 100),
              },
            ],
            dueDays: 30,
            notes: `Auto-generated invoice for login tenure override (cooldown: ${effectiveCooldown} min).`,
            relatedEntityType: "LOGIN_TENURE_OVERRIDE",
            relatedEntityId: sessionId,
          });
          invoiceId = invoice?.id || null;
        } catch {
          // Invoice generation is best-effort.
        }
      }

      return Response.json({
        success: true,
        session: updated,
        verification: {
          type: "cooldown_override",
          previousCooldown: existing.overrideCooldownMinutes,
          newCooldown: effectiveCooldown,
          overriddenBy: apiSession.user.name,
          overriddenByEmail: apiSession.user.email,
          timestamp: updated.lastOverrideAt?.toISOString(),
          auditReference: (auditEntry as { id?: string })?.id || null,
          invoiceId,
        },
      });
    }

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

    let overrideDurationMinutes: number | null = null;
    let overrideCooldownMinutes: number | null = null;

    if (option === "restore") {
      newExpiry = new Date(existing.createdAt.getTime() + AUTH.SESSION_MAX_AGE_SECONDS * 1000);
      policyLabel = "Default Policy";
      overrideDurationMinutes = null;
      overrideCooldownMinutes = null;
    } else if (option === "unlimited") {
      newExpiry = new Date("2099-12-31T23:59:59.999Z");
      policyLabel = "Unlimited Session";
      cost = UNLIMITED_COST;
      overrideDurationMinutes = -1;
      overrideCooldownMinutes = null;
    } else {
      const minutes = option === "custom" ? Math.max(1, Number(customMinutes) || 1) : OPTION_MINUTES[option];
      newExpiry = new Date(Date.now() + minutes * 60 * 1000);
      policyLabel = option === "custom" ? `Custom (${minutes} min)` : option;
      cost = (SESSION_EXTENSION_PRICE_PER_MINUTE || 0) * minutes;
      overrideDurationMinutes = minutes;
      overrideCooldownMinutes = option === "custom" ? Math.max(0, Number(customCooldown) || 0) : null;
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: {
        expiresAt: newExpiry,
        overrideDurationMinutes,
        overrideCooldownMinutes,
        lastOverrideAt: new Date(),
      },
    });

    const policyAuditEntry = await logAudit(
        AUDIT_ACTIONS.SESSION_POLICY_OVERRIDDEN,
        null,
        null,
        apiSession.user.role,
        apiSession.user.name,
        `Session policy overridden for ${existing.teamMember?.email || sessionId}: ${policyLabel} until ${newExpiry.toISOString()}`,
        apiSession.user.email,
      );

    let policyInvoiceId: string | null = null;
    if (cost > 0) {
      try {
        const invoice = await createInvoice({
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
        policyInvoiceId = invoice?.id || null;
      } catch {
        // Invoice generation is best-effort.
      }
    }

    return Response.json({
      success: true,
      session: updated,
      verification: {
        type: "policy_override",
        previousExpiry: existing.expiresAt.toISOString(),
        newExpiry: newExpiry.toISOString(),
        newPolicy: policyLabel,
        overriddenBy: apiSession.user.name,
        overriddenByEmail: apiSession.user.email,
        timestamp: updated.lastOverrideAt?.toISOString(),
        auditReference: policyAuditEntry?.id || null,
        invoiceId: policyInvoiceId,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
