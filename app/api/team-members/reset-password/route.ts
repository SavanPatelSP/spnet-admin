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
    const session = await requireApiPermission("Edit Users");
    const body = await req.json();
    const { id, password } = body;

    if (!id) {
      return Response.json({ error: "Member ID is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id } });
    if (!member) {
      return Response.json({ error: "Team member not found" }, { status: 404 });
    }

    const tempPassword = password || generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.teamMember.update({
      where: { id },
      data: {
        password: hashedPassword,
        isFirstLogin: !password,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.PASSWORD_RESET,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Reset password for team member ${member.name} (${member.email})`,
      session.user.email
    );

    return Response.json({ success: true, tempPassword });
  } catch (error) {
    return handleApiError(error);
  }
}
