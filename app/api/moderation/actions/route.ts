import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET() {
  try {
    await requireApiPermission("Moderate Content");
    const actions = await prisma.moderationAction.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, data: actions });
  } catch (e) {
    return handleApiError(e);
  }
}
