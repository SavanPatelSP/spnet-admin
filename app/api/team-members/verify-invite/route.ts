import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/security/errors";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return Response.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({
      where: { inviteToken: token },
      select: { id: true, name: true, email: true, inviteTokenExpiresAt: true, status: true },
    });

    if (!member) {
      return Response.json({ success: false, error: "Invalid invite token" }, { status: 404 });
    }

    const expired = !member.inviteTokenExpiresAt || member.inviteTokenExpiresAt < new Date();
    if (expired) {
      return Response.json({ success: false, error: "Invite token has expired" }, { status: 410 });
    }

    return Response.json({
      success: true,
      member: { id: member.id, name: member.name, email: member.email, status: member.status },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
