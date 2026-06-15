import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireAuth } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { name, description, riskLevel, protected: isProtected } = body;

    if (!name) {
      return Response.json({ error: "Role name is required" }, { status: 400 });
    }

    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return Response.json({ error: "A role with this name already exists" }, { status: 409 });
    }

    const role = await prisma.role.create({
      data: { name, description: description || "", riskLevel: riskLevel || "Medium", protected: isProtected || false },
    });

    await logAudit(
      AUDIT_ACTIONS.ROLE_CREATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Created role "${name}" with risk level ${role.riskLevel}`
    );

    return Response.json(role);
  } catch (error) {
    console.error("Role create error:", error);
    return Response.json({ error: "Failed to create role" }, { status: 500 });
  }
}
