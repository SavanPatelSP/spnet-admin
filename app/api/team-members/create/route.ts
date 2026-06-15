import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, ADMIN_NAME, ADMIN_ROLE } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, roleId } = body;

    if (!name || !email || !roleId) {
      return Response.json({ error: "Name, email, and role are required" }, { status: 400 });
    }

    const existing = await prisma.teamMember.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "A member with this email already exists" }, { status: 409 });
    }

    const member = await prisma.teamMember.create({
      data: { name, email, roleId },
      include: { role: true },
    });

    await logAudit(
      AUDIT_ACTIONS.TEAM_MEMBER_CREATED,
      undefined,
      undefined,
      ADMIN_ROLE,
      ADMIN_NAME,
      `Created team member ${name} (${email}) with role ${member.role.name}`
    );

    return Response.json(member);
  } catch (error) {
    console.error("Team member create error:", error);
    return Response.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
