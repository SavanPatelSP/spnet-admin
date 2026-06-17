import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requirePermission("View Devices");

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20")));
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";
    const sortBy = url.searchParams.get("sortBy") || "lastSeen";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const allowedSortFields = ["deviceName", "deviceId", "os", "browser", "trustScore", "lastSeen", "createdAt", "ipAddress", "country"];
    const field = allowedSortFields.includes(sortBy) ? sortBy : "lastSeen";

    const where: Record<string, unknown> = {};
    if (status === "blacklisted") {
      where.isBlacklisted = true;
    }
    if (search) {
      where.OR = [
        { deviceId: { contains: search } },
        { deviceName: { contains: search } },
        { ipAddress: { contains: search } },
        { os: { contains: search } },
        { browser: { contains: search } },
        { manufacturer: { contains: search } },
        { model: { contains: search } },
      ];
    }

    const [activations, total] = await Promise.all([
      prisma.activation.findMany({
        where,
        include: {
          license: {
            select: { id: true, key: true, organization: true, plan: true, status: true },
          },
          fingerprint: true,
        },
        orderBy: { [field]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activation.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: {
        activations,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Device list error:", error);
    return Response.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}
