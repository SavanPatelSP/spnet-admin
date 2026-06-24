import { prisma } from "@/lib/prisma";

type AlertType =
  | "LOGIN" | "LOGOUT" | "NEW_DEVICE" | "FAILED_LOGIN" | "LOCKED_ACCOUNT"
  | "PERMISSION_CHANGE" | "ROLE_CHANGE" | "TEMP_PERMISSION_GRANT" | "TEMP_PERMISSION_REVOKE"
  | "PREMIUM_GRANT" | "PREMIUM_REVOKE" | "LIFETIME_CONVERT"
  | "COINS_GRANTED" | "COINS_REMOVED" | "GEMS_GRANTED" | "GEMS_REMOVED"
  | "LICENSE_CREATE" | "LICENSE_TRANSFER" | "LICENSE_DELETE"
  | "ORG_CREATE" | "ORG_DELETE"
  | "TEAM_CREATE" | "TEAM_EDIT" | "TEAM_DELETE" | "OWNERSHIP_TRANSFER"
  | "HIGH_RISK_SESSION" | "SESSION_HIJACK" | "SUSPICIOUS_ACTIVITY";

interface AlertInput {
  type: AlertType;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
}

function getSeverityForType(type: AlertType): string {
  const severityMap: Partial<Record<AlertType, string>> = {
    LOGIN: "LOW",
    LOGOUT: "LOW",
    FAILED_LOGIN: "MEDIUM",
    LOCKED_ACCOUNT: "HIGH",
    PERMISSION_CHANGE: "MEDIUM",
    ROLE_CHANGE: "HIGH",
    TEMP_PERMISSION_GRANT: "MEDIUM",
    TEMP_PERMISSION_REVOKE: "MEDIUM",
    PREMIUM_GRANT: "MEDIUM",
    PREMIUM_REVOKE: "MEDIUM",
    LIFETIME_CONVERT: "HIGH",
    COINS_GRANTED: "LOW",
    COINS_REMOVED: "LOW",
    GEMS_GRANTED: "LOW",
    GEMS_REMOVED: "LOW",
    LICENSE_CREATE: "LOW",
    LICENSE_TRANSFER: "MEDIUM",
    LICENSE_DELETE: "HIGH",
    ORG_CREATE: "LOW",
    ORG_DELETE: "HIGH",
    TEAM_CREATE: "MEDIUM",
    TEAM_EDIT: "LOW",
    TEAM_DELETE: "HIGH",
    OWNERSHIP_TRANSFER: "CRITICAL",
    HIGH_RISK_SESSION: "HIGH",
    SESSION_HIJACK: "CRITICAL",
    SUSPICIOUS_ACTIVITY: "MEDIUM",
  };
  return severityMap[type] || "MEDIUM";
}

export async function createSecurityAlert(input: AlertInput) {
  const severity = input.severity || getSeverityForType(input.type);

  const alert = await prisma.securityAlert.create({
    data: {
      type: input.type,
      severity,
      title: input.title,
      description: input.description,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actorId,
      actorName: input.actorName,
      actorEmail: input.actorEmail,
    },
  });

  // Also create audit log entry
  try {
    await prisma.auditLog.create({
      data: {
        action: `SECURITY_ALERT_${input.type}`,
        severity: severity.toUpperCase(),
        entityType: input.entityType || "security_alert",
        entityId: input.entityId || alert.id,
        actorEmail: input.actorEmail || "system",
        actorName: input.actorName || "System",
        description: input.title + (input.description ? `: ${input.description}` : ""),
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch {
    // best effort
  }

  // Create notifications scoped only to affected user
  try {
    const targetIds = new Set<string>();
    if (input.actorId) targetIds.add(input.actorId);
    if (input.entityType === "session" && input.entityId) {
      const sessionMember = await prisma.session.findUnique({
        where: { id: input.entityId },
        select: { teamMemberId: true },
      });
      if (sessionMember) targetIds.add(sessionMember.teamMemberId);
    }
    if (["PERMISSION_CHANGE", "ROLE_CHANGE", "OWNERSHIP_TRANSFER"].includes(input.type)) {
      const admins = await prisma.teamMember.findMany({
        where: { status: "ACTIVE", role: { name: { in: ["OWNER", "SUPER_ADMIN"] } } },
        select: { id: true },
      });
      admins.forEach(a => targetIds.add(a.id));
    }
    if (targetIds.size > 0) {
      const category = input.type.startsWith("PREMIUM") ? "Premium"
        : input.type.startsWith("COINS") || input.type.startsWith("GEMS") ? "Economy"
        : input.type.startsWith("LICENSE") ? "Licenses"
        : input.type.startsWith("ORG") ? "Organizations"
        : input.type.startsWith("TEAM") ? "Approvals"
        : input.type.startsWith("SESSION") || input.type === "HIGH_RISK_SESSION" || input.type === "SESSION_HIJACK" ? "Security"
        : "System";
      await prisma.notification.createMany({
        data: [...targetIds].map(id => ({
          teamMemberId: id,
          title: `Security Alert: ${input.title}`,
          message: input.description || input.title,
          type: severity === "CRITICAL" || severity === "HIGH" ? "WARNING" : "INFO",
          category,
          priority: severity === "CRITICAL" ? "CRITICAL" : severity === "HIGH" ? "HIGH" : severity === "MEDIUM" ? "MEDIUM" : "LOW",
        })),
      });
    }
  } catch {
    // best effort
  }

  return alert;
}

export async function getSecurityAlerts(options: {
  resolved?: boolean;
  type?: string;
  severity?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const where: Record<string, unknown> = {};
  if (options.resolved !== undefined) where.resolved = options.resolved;
  if (options.type) where.type = options.type;
  if (options.severity) where.severity = options.severity;

  const [alerts, total] = await Promise.all([
    prisma.securityAlert.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.securityAlert.count({ where: where as any }),
  ]);
  return { alerts, total };
}

export async function getSecurityAlertStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    total,
    unresolved,
    critical,
    high,
    todayCount,
    typeCounts,
  ] = await Promise.all([
    prisma.securityAlert.count(),
    prisma.securityAlert.count({ where: { resolved: false } }),
    prisma.securityAlert.count({ where: { severity: "CRITICAL" } }),
    prisma.securityAlert.count({ where: { severity: "HIGH" } }),
    prisma.securityAlert.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.securityAlert.groupBy({ by: ["type"], _count: true }),
  ]);

  return {
    total,
    unresolved,
    critical,
    high,
    todayCount,
    typeCounts,
  };
}

export async function resolveSecurityAlert(id: string, resolvedBy: string) {
  return prisma.securityAlert.update({
    where: { id },
    data: { resolved: true, resolvedAt: new Date(), resolvedBy },
  });
}
