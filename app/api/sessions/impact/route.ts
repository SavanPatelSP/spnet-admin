import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireApiPermission("Manage Sessions");
    const url = new URL(req.url);
    const teamMemberId = url.searchParams.get("teamMemberId");
    if (!teamMemberId) {
      return Response.json({ success: false, error: "teamMemberId required" }, { status: 400 });
    }

    const [sessionCount, activeDeviceCount, lastSession] = await Promise.all([
      prisma.session.count({ where: { teamMemberId } }),
      prisma.activation.count({
        where: { license: { teamMember: { id: teamMemberId } }, status: "ACTIVE" },
      }),
      prisma.session.findFirst({
        where: { teamMemberId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, expiresAt: true },
      }),
    ]);

    return Response.json({
      success: true,
      sessionCount,
      activeDeviceCount,
      lastActivity: lastSession?.createdAt || null,
      lastExpiresAt: lastSession?.expiresAt || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
