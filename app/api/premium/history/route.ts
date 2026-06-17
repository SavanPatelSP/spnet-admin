import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    await requirePermission("View Premium History");

    const { searchParams } = new URL(req.url);
    const licenseId = searchParams.get("licenseId");

    const where = licenseId ? { licenseId } : {};

    const records = await prisma.premiumSubscription.findMany({
      where,
      include: {
        license: {
          select: { organization: true, key: true, plan: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(records);
  } catch (error) {
    console.error("Premium history error:", error);
    return Response.json({ error: "Failed to fetch premium history" }, { status: 500 });
  }
}
