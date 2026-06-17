import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("View Organizations");
    const { id: orgName } = await params;

    const licenses = await prisma.license.findMany({
      where: { organization: orgName },
      include: {
        activations: true,
        coinBalance: true,
        gemBalance: true,
        premiumSubscriptions: true,
        coinTransactions: { orderBy: { createdAt: "desc" }, take: 20 },
        gemTransactions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (licenses.length === 0) {
      return Response.json({ success: false, error: "Organization not found" }, { status: 404 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { organization: orgName },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return Response.json({
      success: true,
      data: {
        name: orgName,
        licenses,
        auditLogs,
        stats: {
          licenseCount: licenses.length,
          activeCount: licenses.filter((l) => l.status === "ACTIVE").length,
          deviceCount: licenses.reduce((s, l) => s + l.activations.length, 0),
          totalCoins: licenses.reduce((s, l) => s + (l.coinBalance?.balance || 0), 0),
          totalGems: licenses.reduce((s, l) => s + (l.gemBalance?.balance || 0), 0),
          premiumCount: licenses.reduce((s, l) => s + l.premiumSubscriptions.length, 0),
        },
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch organization";
    if (message.includes("redirect")) throw e;
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
