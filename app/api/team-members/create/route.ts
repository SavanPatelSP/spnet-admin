import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import bcrypt from "bcryptjs";
import { approvalGuard } from "@/lib/approval-guard";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Invite Team Members");
    const body = await req.json();
    const { name, email, roleId, tempPassword } = body;

    if (!name || !email || !roleId) {
      return Response.json({ success: false, error: "Name, email, and role are required" }, { status: 400 });
    }

    if (!tempPassword) {
      return Response.json({ success: false, error: "Password is required" }, { status: 400 });
    }

    const existing = await prisma.teamMember.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ success: false, error: "A member with this email already exists" }, { status: 409 });
    }

    const guard = await approvalGuard(session, {
      workflowType: "TEAM_CREATE",
      title: `Create Team Member ${name}`,
      target: name,
      reason: body.reason || `Create team member ${name}`,
      payload: body as Record<string, unknown>,
      requesterId: session.user.id, requesterName: session.user.name, requesterEmail: session.user.email,
    });
    if (!guard.allowed) {
      return Response.json({ message: guard.message, requestId: guard.requestId, status: "PENDING" }, { status: 202 });
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const member = await prisma.teamMember.create({
      data: { name, email, roleId, password: hashedPassword },
      include: { role: { select: { name: true } } },
    });

    await logAudit(
      AUDIT_ACTIONS.TEAM_MEMBER_CREATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Created team member ${name} (${email}) with role ${member.role.name}`
    );

    return Response.json({
      success: true,
      data: member,
      tempPassword,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
