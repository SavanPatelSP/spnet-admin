import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import bcrypt from "bcryptjs";

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: "Password must be at least 8 characters" };
  if (!/[A-Z]/.test(password)) return { valid: false, error: "Password must contain an uppercase letter" };
  if (!/[a-z]/.test(password)) return { valid: false, error: "Password must contain a lowercase letter" };
  if (!/[0-9]/.test(password)) return { valid: false, error: "Password must contain a number" };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, error: "Password must contain a special character" };
  return { valid: true };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return Response.json({ success: false, error: "Token and password are required" }, { status: 400 });
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      return Response.json({ success: false, error: validation.error }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({
      where: { inviteToken: token },
      select: { id: true, inviteTokenExpiresAt: true, name: true, email: true, password: true },
    });

    if (!member) {
      return Response.json({ success: false, error: "Invalid invite token" }, { status: 404 });
    }

    const expired = !member.inviteTokenExpiresAt || member.inviteTokenExpiresAt < new Date();
    if (expired) {
      return Response.json({ success: false, error: "Invite token has expired" }, { status: 410 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.teamMember.update({
      where: { id: member.id },
      data: {
        password: hashedPassword,
        inviteToken: null,
        inviteTokenExpiresAt: null,
        passwordSetupAt: new Date(),
        isFirstLogin: true,
        status: "ACTIVE",
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.PASSWORD_CHANGED,
      undefined,
      undefined,
      "SELF_SERVICE",
      member.name,
      `Password setup completed for ${member.name} (${member.email})`,
      member.email
    );

    return Response.json({
      success: true,
      message: "Password created successfully. You can now log in.",
      email: member.email,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
