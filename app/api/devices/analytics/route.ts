import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("View Device Analytics");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalDevices,
      blacklistedCount,
      trustAgg,
      byOs,
      byBrowser,
      byDeviceType,
      byCountry,
      trend,
    ] = await Promise.all([
      prisma.activation.count(),
      prisma.activation.count({ where: { isBlacklisted: true } }),
      prisma.activation.aggregate({ _avg: { trustScore: true } }),
      prisma.activation.groupBy({
        by: ["os"],
        _count: { id: true },
        where: { os: { not: null } },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.activation.groupBy({
        by: ["browser"],
        _count: { id: true },
        where: { browser: { not: null } },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.activation.groupBy({
        by: ["deviceType"],
        _count: { id: true },
        where: { deviceType: { not: null } },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.activation.groupBy({
        by: ["country"],
        _count: { id: true },
        where: { country: { not: null } },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.$queryRawUnsafe<Array<{ date: string; count: number }>>(
        `SELECT date(createdAt) as date, COUNT(*) as count FROM Activation WHERE createdAt >= ? GROUP BY date(createdAt) ORDER BY date ASC`,
        thirtyDaysAgo.toISOString()
      ),
    ]);

    return Response.json({
      success: true,
      data: {
        totalDevices,
        blacklisted: blacklistedCount,
        averageTrustScore: Math.round((trustAgg._avg.trustScore || 0) * 100) / 100,
        byOs: byOs.map((o) => ({ os: o.os, count: o._count.id })),
        byBrowser: byBrowser.map((b) => ({ browser: b.browser, count: b._count.id })),
        byDeviceType: byDeviceType.map((d) => ({ deviceType: d.deviceType, count: d._count.id })),
        byCountry: byCountry.map((c) => ({ country: c.country, count: c._count.id })),
        trend: (trend as Array<{ date: string; count: number }>).map((t) => ({
          date: t.date,
          count: Number(t.count),
        })),
      },
    });
  } catch (error) {
    console.error("Device analytics error:", error);
    return Response.json({ error: "Failed to fetch device analytics" }, { status: 500 });
  }
}
