import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_NAME, ADMIN_ROLE } from "@/lib/constants";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const role = await prisma.role.update({
      where: { id: body.id },
      data: { name: body.name, description: body.description, riskLevel: body.riskLevel },
    });

    await logAudit(
      AUDIT_ACTIONS.ROLE_UPDATED,
      undefined,
      undefined,
      ADMIN_ROLE,
      ADMIN_NAME,
      `Updated role "${role.name}"`
    );

    return Response.json(role);
  } catch (error) {
    console.error("Role update error:", error);
    return Response.json({ error: "Failed to update role" }, { status: 500 });
  }
}
