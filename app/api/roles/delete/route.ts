import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAuth } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function DELETE(req: Request) {
  try {
    const session = await requireAuth();
    const { id } = await req.json();
    const role = await prisma.role.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!role) {
      return Response.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.protected) {
      return Response.json({ error: "Protected roles cannot be deleted" }, { status: 403 });
    }

    if (role.members.length > 0) {
      return Response.json({ error: "Cannot delete role with assigned members" }, { status: 409 });
    }

    await prisma.permission.deleteMany({ where: { roleId: id } });
    await prisma.role.delete({ where: { id } });

    await logAudit(
      AUDIT_ACTIONS.ROLE_DELETED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Deleted role "${role.name}"`
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Role delete error:", error);
    return Response.json({ error: "Failed to delete role" }, { status: 500 });
  }
}
