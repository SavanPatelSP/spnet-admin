import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireApiPermission("View Device Analytics");

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Activation ID is required" }, { status: 400 });
    }

    const activation = await prisma.activation.findUnique({
      where: { id },
      select: { id: true, deviceName: true, deviceId: true },
    });

    if (!activation) {
      return Response.json({ error: "Activation not found" }, { status: 404 });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        action: AUDIT_ACTIONS.DEVICE_TRUST_UPDATED,
        description: {
          contains: activation.deviceName || activation.deviceId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const data = logs.map((log) => {
      const desc = log.description || "";
      const match = desc.match(/(?:Increased|Decreased|Reset) trust score from (\d+)/);
      const prevMatch = desc.match(/from (\d+) to (\d+)/);
      const previousScore = prevMatch ? parseInt(prevMatch[1], 10) : null;
      const newScore = prevMatch ? parseInt(prevMatch[2], 10) : null;
      return {
        previousScore,
        newScore,
        changedBy: log.actorName || "Unknown",
        createdAt: log.createdAt.toISOString(),
      };
    });

    return Response.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
