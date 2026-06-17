import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    await requirePermission("View License Events");
    const url = new URL(req.url);
    const licenseId = url.searchParams.get("licenseId");

    if (!licenseId) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    const events = await prisma.licenseEvent.findMany({
      where: { licenseId },
      orderBy: { createdAt: "desc" },
    });

    const parsed = events.map((e) => ({
      ...e,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
    }));

    return Response.json(parsed);
  } catch (error) {
    console.error("Events get error:", error);
    return Response.json({ error: "Failed to get events" }, { status: 500 });
  }
}
