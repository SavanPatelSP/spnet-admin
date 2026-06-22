import { formatDate } from "@/lib/shared";

export interface PdfInvoiceData {
  invoiceNumber: string;
  type: string;
  category: string | null;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  organization: string | null;
  customerName: string | null;
  customerEmail: string | null;
  actorName: string | null;
  actorEmail: string | null;
  lineItems: { description: string; quantity: number; unitPrice: number; total: number }[];
  notes: string | null;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  license: { key: string; organization: string; plan: string } | null;
}

function fmtCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generateInvoicePdf(data: PdfInvoiceData): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - 2 * margin;
  let y = margin;

  const primary = "#1e40af";
  const gray = "#6b7280";
  const dark = "#111827";
  const lightGray = "#f3f4f6";

  function text(txt: string, x: number, size = 10, color = dark, bold = false) {
    doc.setTextColor(color);
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(txt, x, y);
  }

  function line(yPos: number, color = "#e5e7eb") {
    doc.setDrawColor(color);
    doc.line(margin, yPos, pageW - margin, yPos);
  }

  // Branding Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("SP NET INC", margin, 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("INVOICE / RECEIPT", margin, 26);
  doc.text(`#${data.invoiceNumber}`, margin, 33);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(data.status, pageW - margin, 18, { align: "right" });

  y = 50;

  // From / To
  const colW = contentW / 2 - 5;
  text("FROM", margin, 8, gray, true);
  text("SP NET INC", margin, 10, dark, true);
  text("support@spnet.net", margin, 8, gray);
  text("www.spnet.net", margin, 8, gray);

  text("TO", margin + colW + 10, 8, gray, true);
  text(data.customerName || data.organization || data.license?.organization || "N/A", margin + colW + 10, 10, dark, true);
  if (data.customerEmail) text(data.customerEmail, margin + colW + 10, 8, gray);
  if (data.organization) text(data.organization, margin + colW + 10, 8, gray);

  y += 25;
  line(y);
  y += 8;

  // Details
  const details = [
    { label: "Invoice #", value: data.invoiceNumber },
    { label: "Type", value: data.type },
    { label: "Category", value: data.category || "—" },
    { label: "Issued", value: formatDate(data.issuedAt) },
    { label: "Due", value: data.dueAt ? formatDate(data.dueAt) : "—" },
    { label: "Paid", value: data.paidAt ? formatDate(data.paidAt) : "—" },
  ];

  let rowY = y;
  doc.setFontSize(8);
  details.forEach((d, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * (contentW / 3);
    const ry = y + row * 12;
    doc.setTextColor(gray);
    doc.setFont("helvetica", "bold");
    doc.text(d.label, x, ry);
    doc.setTextColor(dark);
    doc.setFont("helvetica", "normal");
    doc.text(d.value, x, ry + 5);
  });
  y += 32;

  // License info
  if (data.license) {
    line(y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.setFont("helvetica", "bold");
    doc.text("License", margin, y);
    doc.setTextColor(dark);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.license.key} — ${data.license.organization} (${data.license.plan})`, margin + 25, y);
    y += 10;
  }

  // Line Items Table
  line(y);
  y += 8;

  const tableTop = y;
  const colDefs = [
    { x: margin, w: contentW * 0.45 },
    { x: margin + contentW * 0.45, w: contentW * 0.15 },
    { x: margin + contentW * 0.60, w: contentW * 0.2 },
    { x: margin + contentW * 0.80, w: contentW * 0.2 },
  ];

  // Header row
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y - 4, contentW, 8, "F");
  doc.setFontSize(8);
  doc.setTextColor(gray);
  doc.setFont("helvetica", "bold");
  doc.text("Description", colDefs[0].x, y);
  doc.text("Qty", colDefs[1].x + colDefs[1].w, y, { align: "right" });
  doc.text("Unit Price", colDefs[2].x + colDefs[2].w, y, { align: "right" });
  doc.text("Total", colDefs[3].x + colDefs[3].w, y, { align: "right" });
  y += 10;

  // Items
  const startY = y;
  data.lineItems.forEach((item, idx) => {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 4, contentW, 8, "F");
    }

    doc.setFontSize(8);
    doc.setTextColor(dark);
    doc.setFont("helvetica", "normal");
    doc.text(item.description.substring(0, 60), colDefs[0].x, y);
    doc.text(String(item.quantity), colDefs[1].x + colDefs[1].w, y, { align: "right" });
    doc.text(fmtCents(item.unitPrice), colDefs[2].x + colDefs[2].w, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(fmtCents(item.total), colDefs[3].x + colDefs[3].w, y, { align: "right" });
    y += 8;
  });

  if (y > startY) {
    line(y);
    y += 6;
  } else {
    y += 6;
  }

  // Totals
  const totals = [
    { label: "Subtotal", value: fmtCents(data.subtotal), bold: false },
    { label: "Discount", value: data.discount > 0 ? `-${fmtCents(data.discount)}` : "$0.00", bold: false },
    { label: "Tax", value: data.tax > 0 ? fmtCents(data.tax) : "$0.00", bold: false },
    { label: "Total", value: fmtCents(data.total), bold: true },
  ];

  totals.forEach((t) => {
    doc.setFontSize(t.bold ? 11 : 9);
    doc.setTextColor(dark);
    doc.setFont("helvetica", t.bold ? "bold" : "normal");
    doc.text(t.label, pageW - margin - 50, y);
    doc.text(t.value, pageW - margin, y, { align: "right" });
    y += t.bold ? 8 : 6;
  });

  y += 6;
  line(y);
  y += 8;

  // Notes
  if (data.notes) {
    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(data.notes.substring(0, 200), margin, y);
    y += 10;
  }

  // Footer
  const footerY = 285;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, footerY, pageW, 12, "F");
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("SP NET INC — support@spnet.net — www.spnet.net", pageW / 2, footerY + 8, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
