import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    await requirePermission("Manage Sessions");
    const url = new URL(req.url);
    const teamMemberId = url.searchParams.get("teamMemberId");

    if (!teamMemberId) {
      return Response.json({ error: "teamMemberId query parameter is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
    if (!member) {
      return Response.json({ error: "Team member not found" }, { status: 404 });
    }

    const activeSessions = await prisma.session.findMany({
      where: {
        teamMemberId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ sessions: activeSessions });
  } catch (error) {
    console.error("Session list error:", error);
    return Response.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}
