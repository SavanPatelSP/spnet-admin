import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("Moderate Content");
    const { id } = await params;
    const action = await prisma.moderationAction.findUnique({ where: { id } });
    if (!action) {
      return Response.json({ success: false, error: "Action not found" }, { status: 404 });
    }
    await prisma.moderationAction.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete action";
    if (message.includes("redirect")) throw e;
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
