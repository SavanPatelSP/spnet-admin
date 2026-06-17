import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("Moderate Content");
    const { id } = await params;
    const report = await prisma.moderationReport.findUnique({ where: { id } });
    if (!report) {
      return Response.json({ success: false, error: "Report not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: report });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch report";
    if (message.includes("redirect")) throw e;
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
