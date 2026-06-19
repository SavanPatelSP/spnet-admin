import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Edit Roles");
    const body = await req.json();
    if (!body.roleId) {
      return Response.json({ error: "Role ID is required" }, { status: 400 });
    }

    await prisma.permission.deleteMany({ where: { roleId: body.roleId } });

    if (body.permissions?.length) {
      await prisma.permission.createMany({
        data: body.permissions.map((permission: string) => ({
          roleId: body.roleId,
          permission,
        })),
      });
    }

    const role = await prisma.role.findUnique({ where: { id: body.roleId } });
    await logAudit(
      AUDIT_ACTIONS.ROLE_PERMISSIONS_UPDATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Updated permissions for role "${role?.name}" (${body.permissions?.length || 0} permissions)`
    );

    return Response.json({ success: true, count: body.permissions?.length || 0 });
  } catch (error) {
    return handleApiError(error);
  }
}
