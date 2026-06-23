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
    const { id } = body;

    if (!id) {
      return Response.json({ success: false, error: "Member ID is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id }, include: { role: true } });
    if (!member) {
      return Response.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    const oldHash = member.password;

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.teamMember.update({
      where: { id },
      data: {
        password: hashedPassword,
        isFirstLogin: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const saved = await prisma.teamMember.findUnique({ where: { id }, select: { password: true, updatedAt: true } });
    const bcryptResult = saved ? await bcrypt.compare(tempPassword, saved.password) : false;

    if (!saved || !bcryptResult) {
      throw new Error("Password hash verification failed after save");
    }

    await logAudit(
      AUDIT_ACTIONS.TEMP_PASSWORD_GENERATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Generated temporary password for ${member.name} (${member.email})`,
      session.user.email
    );

    return Response.json({ success: true, tempPassword });
  } catch (error) {
    return handleApiError(error);
  }
}
