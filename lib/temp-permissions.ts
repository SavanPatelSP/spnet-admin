import { prisma } from "@/lib/prisma";

const VALID_DURATIONS = [15, 30, 60, 240, 1440]; // minutes

export async function grantTemporaryPermission(params: {
  permission: string;
  roleId?: string;
  teamMemberId?: string;
  grantedById: string;
  grantedByName?: string;
  grantedByEmail?: string;
  durationMinutes: number;
  reason: string;
}) {
  if (!VALID_DURATIONS.includes(params.durationMinutes)) {
    throw new Error(`Invalid duration. Must be one of: ${VALID_DURATIONS.join(", ")}`);
  }

  const expiresAt = new Date(Date.now() + params.durationMinutes * 60 * 1000);

  const tempPerm = await prisma.temporaryPermission.create({
    data: {
      permission: params.permission,
      roleId: params.roleId || null,
      teamMemberId: params.teamMemberId || null,
      grantedById: params.grantedById,
      grantedByName: params.grantedByName,
      grantedByEmail: params.grantedByEmail,
      duration: params.durationMinutes,
      expiresAt,
      reason: params.reason,
      active: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "TEMP_PERMISSION_GRANTED",
      severity: "MEDIUM",
      entityType: params.teamMemberId ? "team_member" : "role",
      entityId: params.teamMemberId || params.roleId,
      actorEmail: params.grantedByEmail || "system",
      actorName: params.grantedByName || "System",
      description: `Temporary permission "${params.permission}" granted for ${params.durationMinutes}min to ${params.teamMemberId || params.roleId}. Reason: ${params.reason}`,
      metadata: JSON.stringify({
        permission: params.permission,
        duration: params.durationMinutes,
        expiresAt: expiresAt.toISOString(),
        reason: params.reason,
      }),
    },
  });

  return tempPerm;
}

export async function revokeExpiredPermissions() {
  const now = new Date();
  const expired = await prisma.temporaryPermission.findMany({
    where: {
      active: true,
      expiresAt: { lte: now },
    },
  });

  if (expired.length === 0) return { revoked: 0 };

  await prisma.temporaryPermission.updateMany({
    where: {
      id: { in: expired.map(e => e.id) },
    },
    data: {
      active: false,
      revokedAt: now,
    },
  });

  for (const perm of expired) {
    try {
      await prisma.auditLog.create({
        data: {
          action: "TEMP_PERMISSION_EXPIRED",
          severity: "LOW",
          entityType: perm.teamMemberId ? "team_member" : "role",
          entityId: perm.teamMemberId || perm.roleId,
          description: `Temporary permission "${perm.permission}" auto-expired`,
        },
      });
    } catch {
      // best effort
    }
  }

  return { revoked: expired.length };
}

export async function revokeTemporaryPermission(id: string, revokedById?: string) {
  return prisma.temporaryPermission.update({
    where: { id },
    data: {
      active: false,
      revokedAt: new Date(),
      revokedById,
    },
  });
}

export async function getActiveTemporaryPermissions(options: {
  teamMemberId?: string;
  roleId?: string;
  limit?: number;
} = {}) {
  const where: Record<string, unknown> = { active: true, expiresAt: { gt: new Date() } };
  if (options.teamMemberId) where.teamMemberId = options.teamMemberId;
  if (options.roleId) where.roleId = options.roleId;

  return prisma.temporaryPermission.findMany({
    where: where as any,
    orderBy: { expiresAt: "asc" },
    take: options.limit || 50,
    include: {
      teamMember: { select: { name: true, email: true } },
      role: { select: { name: true } },
    },
  });
}

export async function getTemporaryPermissionStats() {
  const [active, expired] = await Promise.all([
    prisma.temporaryPermission.count({
      where: { active: true, expiresAt: { gt: new Date() } },
    }),
    prisma.temporaryPermission.count({
      where: { active: false },
    }),
  ]);
  return { active, expired };
}

export async function isPermissionTemporarilyGranted(teamMemberId: string, permission: string): Promise<boolean> {
  const count = await prisma.temporaryPermission.count({
    where: {
      teamMemberId,
      permission,
      active: true,
      expiresAt: { gt: new Date() },
    },
  });
  return count > 0;
}
