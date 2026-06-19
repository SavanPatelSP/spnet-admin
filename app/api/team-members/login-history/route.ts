import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET(req: Request) {
  try {
    await requireApiPermission("View Login History");
    const url = new URL(req.url);
    const teamMemberId = url.searchParams.get("teamMemberId");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (!teamMemberId) {
      return Response.json({ error: "teamMemberId query parameter is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
    if (!member) {
      return Response.json({ error: "Team member not found" }, { status: 404 });
    }

    const history = await prisma.loginHistory.findMany({
      where: { teamMemberId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return Response.json({ loginHistory: history });
  } catch (error) {
    return handleApiError(error);
  }
}
