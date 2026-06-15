import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_NAME, ADMIN_ROLE } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const body = await req.json();

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
      ADMIN_ROLE,
      ADMIN_NAME,
      `Updated permissions for role "${role?.name}" (${body.permissions?.length || 0} permissions)`
    );

    return Response.json({ success: true, count: body.permissions?.length || 0 });
  } catch (error) {
    console.error("Permissions update error:", error);
    return Response.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}
