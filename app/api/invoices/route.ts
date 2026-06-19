import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError, ValidationError } from "@/lib/security/errors";
import { createInvoice } from "@/lib/invoices";

export async function GET(req: NextRequest) {
  try {
    await requireApiPermission("Manage Invoices");

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const licenseId = searchParams.get("licenseId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") || "20")));

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (licenseId) where.licenseId = licenseId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { organization: { contains: search, mode: "insensitive" } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { issuedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { license: { select: { key: true, organization: true, plan: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    return Response.json({ success: true, invoices, total, page, pageSize });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiPermission("Manage Invoices");
    const body = await req.json();

    if (!body.subtotal || Number(body.subtotal) < 0) {
      throw new ValidationError("Subtotal must be a positive number");
    }
    if (!Array.isArray(body.lineItems) || body.lineItems.length === 0) {
      throw new ValidationError("At least one line item is required");
    }

    const invoice = await createInvoice({
      licenseId: body.licenseId,
      organization: body.organization,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      status: body.status || "PENDING",
      type: body.type || "SALE",
      subtotal: Number(body.subtotal),
      discount: body.discount ? Number(body.discount) : 0,
      tax: body.tax ? Number(body.tax) : 0,
      currency: body.currency || "USD",
      lineItems: body.lineItems,
      dueDays: body.dueDays ? Number(body.dueDays) : 30,
      notes: body.notes,
      relatedEntityType: body.relatedEntityType,
      relatedEntityId: body.relatedEntityId,
    });

    return Response.json({ success: true, invoice }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
