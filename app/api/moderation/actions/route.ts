import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requirePermission("Moderate Content");
    const actions = await prisma.moderationAction.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ success: true, data: actions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch actions";
    if (message.includes("redirect")) throw e;
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
