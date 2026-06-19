import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Edit Roles");
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
    return handleApiError(error);
  }
}
