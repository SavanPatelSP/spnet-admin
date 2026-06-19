import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

const DEVICE_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "BLACKLISTED"] as const;
type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export async function GET(req: Request) {
  try {
    await requireApiPermission("View Devices");

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20")));
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";
    const sortBy = url.searchParams.get("sortBy") || "lastSeenAt";
    const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const allowedSortFields = ["deviceName", "deviceId", "os", "browser", "trustScore", "lastSeenAt", "createdAt", "ipAddress", "country", "status"];
    const field = allowedSortFields.includes(sortBy) ? sortBy : "lastSeenAt";

    const where: Record<string, unknown> = {};
    if (DEVICE_STATUSES.includes(status as DeviceStatus)) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { deviceId: { contains: search } },
        { deviceName: { contains: search } },
        { ipAddress: { contains: search } },
        { os: { contains: search } },
        { browser: { contains: search } },
        { deviceType: { contains: search } },
      ];
    }

    const [activations, total] = await Promise.all([
      prisma.activation.findMany({
        where,
        include: {
          license: {
            select: { id: true, key: true, organization: true, plan: true, status: true },
          },
          deviceFingerprint: {
            select: { id: true, fingerprint: true, firstSeenAt: true, lastSeenAt: true, activationCount: true },
          },
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
    return handleApiError(error);
  }
}
