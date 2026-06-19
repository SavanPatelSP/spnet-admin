import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, AUTH_URL } from "@/lib/constants";
import crypto from "crypto";

const INVITE_TOKEN_EXPIRY_HOURS = 72;

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function buildInviteLink(token: string): string {
  return `${AUTH_URL}/invite/${token}`;
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Invite Team Members");
    const body = await req.json();
    const { id, resend } = body;

    if (!id) {
      return Response.json({ success: false, error: "Member ID is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id }, include: { role: true } });
    if (!member) {
      return Response.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.teamMember.update({
      where: { id },
      data: {
        inviteToken: token,
        inviteTokenExpiresAt: expiresAt,
        status: member.status === "ACTIVE" ? member.status : "PENDING",
      },
    });

    const inviteLink = buildInviteLink(token);

    // Email delivery is mocked here. In production, integrate with your email provider.
    console.log(`[INVITE EMAIL] To: ${member.email} | Link: ${inviteLink}`);

    await logAudit(
      resend ? AUDIT_ACTIONS.INVITE_RESENT : AUDIT_ACTIONS.INVITE_SENT,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `${resend ? "Resent" : "Sent"} invite to ${member.name} (${member.email})`,
      session.user.email
    );

    return Response.json({
      success: true,
      inviteLink,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
