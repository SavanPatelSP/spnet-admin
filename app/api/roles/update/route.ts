import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requirePermission("Edit Roles");
    const body = await req.json();
    if (!body.id) {
      return Response.json({ error: "Role ID is required" }, { status: 400 });
    }
    const role = await prisma.role.update({
      where: { id: body.id },
      data: { name: body.name, description: body.description, riskLevel: body.riskLevel },
    });

    await logAudit(
      AUDIT_ACTIONS.ROLE_UPDATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Updated role "${role.name}"`
    );

    return Response.json(role);
  } catch (error) {
    console.error("Role update error:", error);
    return Response.json({ error: "Failed to update role" }, { status: 500 });
  }
}
