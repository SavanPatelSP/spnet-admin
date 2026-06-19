import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateTempPassword(): string {
  return crypto.randomBytes(12).toString("hex");
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Invite Team Members");
    const body = await req.json();
    const { name, email, roleId } = body;

    if (!name || !email || !roleId) {
      return Response.json({ success: false, error: "Name, email, and role are required" }, { status: 400 });
    }

    const existing = await prisma.teamMember.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ success: false, error: "A member with this email already exists" }, { status: 409 });
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const member = await prisma.teamMember.create({
      data: { name, email, roleId, password: hashedPassword },
      include: { role: true },
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
