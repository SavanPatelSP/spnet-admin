import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Manage Sessions");
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return Response.json({ success: false, error: "sessionId is required" }, { status: 400 });
    }

    const existing = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { teamMember: true },
    });

    if (!existing) {
      return Response.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    await prisma.session.delete({ where: { id: sessionId } });

    await logAudit(
      AUDIT_ACTIONS.SESSION_REVOKED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Revoked session for team member ${existing.teamMember.name} (${existing.teamMember.email})`,
      session.user.email
    );

    return Response.json({ success: true, message: "Session revoked" });
  } catch (error) {
    console.error("Session revoke error:", error);
    return Response.json({ success: false, error: "Failed to revoke session" }, { status: 500 });
  }
}
