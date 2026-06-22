import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET(req: NextRequest) {
  try {
    await requireApiPermission("Manage Invoices");

    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: { issuedAt?: { gte?: Date; lte?: Date } } = {};
    if (from || to) {
      dateFilter.issuedAt = {};
      if (from) dateFilter.issuedAt.gte = new Date(from);
      if (to) dateFilter.issuedAt.lte = new Date(to);
    }

    const [invoices, revenueByCategory, revenueByAction, countsByStatus, growth] = await Promise.all([
      prisma.invoice.findMany({ where: dateFilter }),
      prisma.invoice.groupBy({
        by: ["category"],
        where: { ...dateFilter, status: { in: ["PAID", "PENDING"] } },
        _sum: { total: true },
      }),
      prisma.invoice.groupBy({
        by: ["action"],
        where: { ...dateFilter, status: { in: ["PAID", "PENDING"] } },
        _sum: { total: true },
      }),
      prisma.invoice.groupBy({
        by: ["status"],
        where: dateFilter,
        _count: { status: true },
      }),
      prisma.invoice.groupBy({
        by: ["issuedAt"],
        where: dateFilter,
        _sum: { total: true },
        _count: { id: true },
        orderBy: { issuedAt: "asc" },
      }),
    ]);

    const totalRevenue = invoices
      .filter((i) => ["PAID", "PENDING"].includes(i.status))
      .reduce((sum, i) => sum + i.total, 0);
    const outstanding = invoices
      .filter((i) => ["PENDING", "OVERDUE"].includes(i.status))
      .reduce((sum, i) => sum + i.total, 0);
    const totalInvoices = invoices.length;

    const categoryData = revenueByCategory.map((r) => ({
      name: r.category || "OTHER",
      value: r._sum.total || 0,
    }));

    const actionData = revenueByAction
      .filter((r) => r.action)
      .map((r) => ({
        name: r.action as string,
        value: r._sum.total || 0,
      }));

    const statusCounts = countsByStatus.reduce((acc, c) => {
      acc[c.status] = c._count.status;
      return acc;
    }, {} as Record<string, number>);

    const growthData = growth.map((g) => ({
      date: g.issuedAt.toISOString().split("T")[0],
      revenue: g._sum.total || 0,
      count: g._count.id,
    }));

    return Response.json({
      success: true,
      summary: { totalRevenue, outstanding, totalInvoices },
      revenueByCategory: categoryData,
      revenueByAction: actionData,
      countsByStatus: statusCounts,
      growth: growthData,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
