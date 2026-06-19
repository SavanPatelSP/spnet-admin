import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiPermission("View Device Analytics");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ranges = [
      { range: "0-20", gte: 0, lte: 20 },
      { range: "21-40", gte: 21, lte: 40 },
      { range: "41-60", gte: 41, lte: 60 },
      { range: "61-80", gte: 61, lte: 80 },
      { range: "81-100", gte: 81, lte: 100 },
    ] as const;

    const [
      totalDevices,
      blacklistedCount,
      suspendedCount,
      inactiveCount,
      trustAgg,
      byOs,
      byBrowser,
      byDeviceType,
      byCountry,
      trend,
      ...trustCounts
    ] = await Promise.all([
      prisma.activation.count(),
      prisma.activation.count({ where: { status: "BLACKLISTED" } }),
      prisma.activation.count({ where: { status: "SUSPENDED" } }),
      prisma.activation.count({ where: { status: "INACTIVE" } }),
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
      ...ranges.map((r) =>
        prisma.activation.count({ where: { trustScore: { gte: r.gte, lte: r.lte } } })
      ),
    ]);

    return Response.json({
      success: true,
      data: {
        totalDevices,
        blacklisted: blacklistedCount,
        suspended: suspendedCount,
        inactive: inactiveCount,
        averageTrustScore: Math.round((trustAgg._avg.trustScore || 0) * 100) / 100,
        byOs: byOs.map((o) => ({ os: o.os, count: o._count.id })),
        byBrowser: byBrowser.map((b) => ({ browser: b.browser, count: b._count.id })),
        byDeviceType: byDeviceType.map((d) => ({ deviceType: d.deviceType, count: d._count.id })),
        byCountry: byCountry.map((c) => ({ country: c.country, count: c._count.id })),
        trend: (trend as Array<{ date: string; count: number }>).map((t) => ({
          date: t.date,
          count: Number(t.count),
        })),
        trustDistribution: ranges.map((r, i) => ({
          range: r.range,
          count: trustCounts[i],
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
