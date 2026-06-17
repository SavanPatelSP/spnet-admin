import { prisma } from "@/lib/prisma";

export interface AuditEvent {
  action: string;
  actorId?: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  targetId?: string;
  targetType?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
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
      },
    });
  } catch {
    // Swallow audit logging errors
  }
}

export function createAuditEvent(
  action: string,
  overrides: Partial<AuditEvent> = {}
): AuditEvent {
  return {
    action,
    ...overrides,
  };
}
