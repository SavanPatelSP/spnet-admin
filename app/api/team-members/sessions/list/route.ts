import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET(req: Request) {
  try {
    const session = await requireApiPermission("Manage Sessions");
    const url = new URL(req.url);
    const teamMemberId = url.searchParams.get("teamMemberId");
    const days = url.searchParams.get("days");

    if (teamMemberId) {
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
    }

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 500, 1), 500);

    const where: Record<string, unknown> = {};
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - Number(days));
      where.createdAt = { gte: since };
    }

    const allSessions = await prisma.session.findMany({
      where: where as Prisma.SessionWhereInput,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        teamMember: { select: { name: true, email: true } },
      },
    });

    return Response.json({ sessions: allSessions });
  } catch (error) {
    return handleApiError(error);
  }
}
