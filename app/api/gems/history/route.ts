import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    await requirePermission("View Gem History");
    const { searchParams } = new URL(req.url);
    const licenseId = searchParams.get("licenseId");

    const where = licenseId ? { licenseId } : {};

    const transactions = await prisma.gemTransaction.findMany({
      where,
      include: {
        license: { select: { organization: true, key: true } },
        reward: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return Response.json(transactions);
  } catch (error) {
    console.error("Gems history error:", error);
    return Response.json({ error: "Failed to fetch gem history" }, { status: 500 });
  }
}
