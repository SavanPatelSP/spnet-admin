import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { generateInvoicePdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiPermission("View Invoices");
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { license: { select: { key: true, organization: true, plan: true } } },
    });

    if (!invoice) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    let lineItems: { description: string; quantity: number; unitPrice: number; total: number }[] = [];
    try {
      if (invoice.lineItems) {
        lineItems = JSON.parse(invoice.lineItems);
      }
    } catch {
      lineItems = [];
    }

    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      category: invoice.category,
      status: invoice.status,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      tax: invoice.tax,
      total: invoice.total,
      currency: invoice.currency,
      organization: invoice.organization,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      actorName: invoice.actorName,
      actorEmail: invoice.actorEmail,
      lineItems,
      notes: invoice.notes,
      issuedAt: invoice.issuedAt.toISOString(),
      dueAt: invoice.dueAt?.toISOString() || null,
      paidAt: invoice.paidAt?.toISOString() || null,
      license: invoice.license,
    };

    const pdfBuffer = await generateInvoicePdf(pdfData);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
