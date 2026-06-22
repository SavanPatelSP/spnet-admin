import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET(request: Request) {
  try {
    await requireApiPermission("View Audit Logs");

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25")));
    const action = url.searchParams.get("action");
    const severity = url.searchParams.get("severity");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const search = url.searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (severity) {
      where.severity = severity;
    }

    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) createdAt.gte = new Date(from);
      if (to) createdAt.lte = new Date(to);
      where.createdAt = createdAt;
    }

    if (search) {
      where.OR = [
        { actorName: { contains: search } },
        { actorEmail: { contains: search } },
        { description: { contains: search } },
        { entityType: { contains: search } },
        { entityId: { contains: search } },
      ];
    }

    const [total, events] = await Promise.all([
      prisma.auditLog.count({ where: where as Prisma.AuditLogWhereInput }),
      prisma.auditLog.findMany({
        where: where as Prisma.AuditLogWhereInput,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return Response.json({
      success: true,
      data: {
        events: events.map((e) => ({
          id: e.id,
          action: e.action,
          severity: e.severity,
          entityType: e.entityType,
          entityId: e.entityId,
          actorName: e.actorName,
          actorEmail: e.actorEmail,
          description: e.description,
          metadata: e.metadata ? JSON.parse(e.metadata) : null,
          createdAt: e.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
