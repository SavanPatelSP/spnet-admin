import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, AUTH_URL } from "@/lib/constants";
import crypto from "crypto";

const LINK_EXPIRY_HOURS = 24;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
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

    const token = generateToken();
    const expiresAt = new Date(Date.now() + LINK_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.teamMember.update({
      where: { id },
      data: {
        inviteToken: token,
        inviteTokenExpiresAt: expiresAt,
      },
    });

    const link = `${AUTH_URL}/setup-password?token=${token}`;

    await logAudit(
      AUDIT_ACTIONS.PASSWORD_SETUP_LINK_GENERATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Generated password setup link for ${member.name} (${member.email})`,
      session.user.email
    );

    return Response.json({ success: true, link, token, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    return handleApiError(error);
  }
}
