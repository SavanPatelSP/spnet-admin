import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { PERMISSION_GROUPS, ALL_PERMISSIONS, AUDIT_ACTIONS } from "@/lib/constants";

export async function GET() {
  try {
    await requireApiPermission("Edit Roles");
    return Response.json(PERMISSION_GROUPS);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Edit Roles");
    const body = await req.json();
    const roleId: string | undefined = body.roleId;

    if (roleId) {
      await syncRolePermissions(roleId, session);
      return Response.json({ success: true });
    }

    const roles = await prisma.role.findMany({ select: { id: true } });
    for (const role of roles) {
      await syncRolePermissions(role.id, session);
    }

    return Response.json({ success: true, roleCount: roles.length });
  } catch (error) {
    return handleApiError(error);
  }
}

async function syncRolePermissions(roleId: string, session: { user: { role: string; name: string } }) {
  const existing = await prisma.permission.findMany({
    where: { roleId },
    select: { permission: true, id: true },
  });

  const existingSet = new Set(existing.map((p) => p.permission));
  const allowedSet = new Set<string>(ALL_PERMISSIONS);

  const toAdd = ALL_PERMISSIONS.filter((p) => !existingSet.has(p));
  const toRemove = existing.filter((p) => !allowedSet.has(p.permission)).map((p) => p.id);

  if (toAdd.length > 0) {
    await prisma.permission.createMany({
      data: toAdd.map((permission) => ({ roleId, permission })),
    });
  }

  if (toRemove.length > 0) {
    await prisma.permission.deleteMany({
      where: { id: { in: toRemove } },
    });
  }

  if (toAdd.length > 0 || toRemove.length > 0) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    await logAudit(
      AUDIT_ACTIONS.ROLE_PERMISSIONS_UPDATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Synced permissions for role "${role?.name}" (added ${toAdd.length}, removed ${toRemove.length})`
    );
  }
}
