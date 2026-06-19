import { prisma } from "@/lib/prisma";
import type { AuditEvent } from "@/lib/security/audit";

export async function logAudit(
  action: string,
  licenseId?: string | null,
  organization?: string | null,
  actorRole?: string | null,
  actorName?: string | null,
  description?: string | null,
  actorEmail?: string | null,
  severity?: string | null,
  entityType?: string | null,
  entityId?: string | null,
  metadata?: Record<string, unknown> | null,
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        licenseId,
        organization,
        actorRole,
        actorName,
        description,
        actorEmail,
        severity: severity ?? "Medium",
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch {
    // Swallow audit logging errors
  }
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: event.action,
        licenseId: event.targetType === "license" ? event.targetId : null,
        organization: (event.metadata?.organization as string) || null,
        actorRole: event.actorRole || null,
        actorName: event.actorName || null,
        actorEmail: event.actorEmail || null,
        description: event.description || null,
        severity: (event.metadata?.severity as string) ?? "Medium",
        entityType: event.targetType || null,
        entityId: event.targetId || null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      },
    });
  } catch {
    // Swallow audit logging errors
  }
}
