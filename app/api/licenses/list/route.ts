import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requirePermission("View Licenses");
    const licenses = await prisma.license.findMany({
      select: { id: true, key: true, organization: true },
      orderBy: { organization: "asc" },
    });
    return Response.json(licenses);
  } catch (error) {
    console.error("Licenses list error:", error);
    return Response.json([], { status: 500 });
  }
}
