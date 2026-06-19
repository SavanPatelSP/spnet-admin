import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/security/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission("Manage Invoices");
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { license: { select: { key: true, organization: true, plan: true, teamMember: { select: { name: true, email: true } } } } },
    });
    if (!invoice) throw new NotFoundError("Invoice not found");

    const auditHistory = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: id },
          invoice.licenseId ? { licenseId: invoice.licenseId } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return Response.json({ success: true, invoice, auditHistory });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission("Manage Invoices");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Invoice not found");

    const updates: Record<string, unknown> = {};
    if (body.status && ["DRAFT", "PENDING", "PAID", "OVERDUE", "CANCELLED", "REFUNDED", "ARCHIVED"].includes(body.status)) {
      updates.status = body.status;
      if (body.status === "PAID" && existing.status !== "PAID") updates.paidAt = new Date();
    }
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.customerName !== undefined) updates.customerName = body.customerName;
    if (body.customerEmail !== undefined) updates.customerEmail = body.customerEmail;
    if (body.dueAt !== undefined) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null;
    if (body.organization !== undefined) updates.organization = body.organization;
    if (body.type !== undefined) updates.type = body.type;
    if (body.category !== undefined) updates.category = body.category;
    if (body.action !== undefined) updates.action = body.action;
    if (body.isArchived !== undefined) {
      updates.isArchived = body.isArchived;
      updates.archivedAt = body.isArchived ? new Date() : null;
    }

    const invoice = await prisma.invoice.update({ where: { id }, data: updates });
    return Response.json({ success: true, invoice });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission("Manage Invoices");
    const { id } = await params;
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Invoice not found");
    await prisma.invoice.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
