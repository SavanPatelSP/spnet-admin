import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    await requirePermission("View Coin History");
    const { searchParams } = new URL(req.url);
    const licenseId = searchParams.get("licenseId");

    const where = licenseId ? { licenseId } : {};

    const transactions = await prisma.coinTransaction.findMany({
      where,
      include: {
        license: { select: { organization: true, key: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return Response.json(transactions);
  } catch (error) {
    console.error("Coins history error:", error);
    return Response.json({ error: "Failed to fetch transaction history" }, { status: 500 });
  }
}
