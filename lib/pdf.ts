import { formatDate, formatDateTime } from "@/lib/shared";

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

function fmtCents(c: number): string {
  return `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generateInvoicePdf(data: PdfInvoiceData): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const qrcode = await import("qrcode");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = 210;
  const ph = 297;
  const m = 20;
  const cw = pw - 2 * m;

  const cDark = "#0f172a";
  const cAccent = "#2563eb";
  const cBody = "#1e293b";
  const cGray = "#64748b";
  const cMuted = "#94a3b8";
  const cLight = "#f1f5f8";
  const cBorder = "#e2e8f0";

  function hex(h: string) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function st(h: string) { const [r, g, b] = hex(h); doc.setTextColor(r, g, b); }
  function sf(h: string) { const [r, g, b] = hex(h); doc.setFillColor(r, g, b); }
  function sd(h: string) { const [r, g, b] = hex(h); doc.setDrawColor(r, g, b); }

  function tl(s: string, x: number, sz = 10, color = cBody, bold = false) {
    st(color); doc.setFontSize(sz); doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(s, x, y);
  }

  function tr(s: string, x: number, sz = 10, color = cBody, bold = false) {
    st(color); doc.setFontSize(sz); doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(s, x, y, { align: "right" });
  }

  function hr(y: number, color = cBorder) { sd(color); doc.setLineWidth(0.35); doc.line(m, y, m + cw, y); }

  function ensure(y: number, needed: number): number {
    if (y + needed > ph - 24) {
      doc.addPage();
      return m;
    }
    return y;
  }

  let y = m;

  // ═══════════════════════════════════════════════════════════════
  // WATERMARK — 12% opacity, rotated, behind all content
  // ═══════════════════════════════════════════════════════════════
  try {
    const jspdfMod = await import("jspdf");
    if (jspdfMod.GState) {
      doc.saveGraphicsState();
      doc.setGState(new jspdfMod.GState({ opacity: 0.12 }));
    }
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    st("#0f172a");
    doc.text("SP NET INC", pw / 2, ph / 2, { align: "center", angle: -25 } as Record<string, unknown>);
    if (jspdfMod.GState) {
      doc.restoreGraphicsState();
    }
  } catch {
    st("#e2e8f0");
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.text("SP NET INC", pw / 2, ph / 2, { align: "center" } as Record<string, unknown>);
  }

  // ═══════════════════════════════════════════════════════════════
  // COVER HEADER
  // ═══════════════════════════════════════════════════════════════
  sf(cDark);
  doc.rect(0, 0, pw, 50, "F");
  sf(cAccent);
  doc.rect(0, 49, pw, 1.5, "F");

  const rx = pw - m;

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("SP NET INC", m, 16);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(cMuted);
  doc.text("Administrative Billing System", m, 24);
  doc.text("SP NET GRAM ADMIN PANEL", m, 31);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pw / 2, 16, { align: "center" });
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(cMuted);
  doc.text("INVOICE DOCUMENT", pw / 2, 23, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`#${data.invoiceNumber}`, rx, 14, { align: "right" });
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(cMuted);
  doc.text(`Issued: ${formatDate(data.issuedAt)}`, rx, 22, { align: "right" });
  doc.text(`Due: ${data.dueAt ? formatDate(data.dueAt) : "—"}`, rx, 28, { align: "right" });

  // Status ribbon
  const rMap: Record<string, string> = {
    PAID: "#059669", PENDING: "#d97706", FAILED: "#dc2626",
    REFUNDED: "#2563eb", DRAFT: "#6b7280", OVERDUE: "#dc2626",
    CANCELLED: "#6b7280", ARCHIVED: "#7c3aed",
  };
  const rRgb = hex(rMap[data.status.toUpperCase()] || "#6b7280");
  const rLabel = data.status.toUpperCase();
  const rw = doc.getTextWidth(rLabel) + 14;
  const rxx = pw - m - rw + 3;
  sf(`#${rRgb.map(c => c.toString(16).padStart(2, "0")).join("")}`);
  doc.rect(rxx, 34, rw, 7, "F");
  const drgb = rRgb.map(c => Math.round(c * 0.7));
  sf(`#${drgb.map(c => c.toString(16).padStart(2, "0")).join("")}`);
  doc.triangle(rxx + rw, 34, rxx + rw + 4, 34, rxx + rw, 37.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(rLabel, rxx + rw / 2, 39, { align: "center" });

  // ─────────────────────────────────────────────────────────────
  // FROM / BILL TO
  // ─────────────────────────────────────────────────────────────
  y = 56;
  y = ensure(y, 48);

  const cardW = cw / 2 - 4;
  const fromX = m;
  const toX = m + cardW + 8;

  const toItems: { label: string; value: string }[] = [
    { label: "Customer", value: data.customerName || "—" },
    { label: "Organization", value: data.organization || data.license?.organization || "—" },
    { label: "License", value: data.license?.key || "—" },
    { label: "Account Type", value: data.license?.plan || "—" },
  ];
  const valMaxW = cardW - 26;
  let toContentH = 4;
  toItems.forEach((it) => {
    const lines = doc.splitTextToSize(it.value, valMaxW);
    toContentH += Math.max(lines.length * 3.5 + 0.5, 5);
  });
  toContentH += 7;
  const fromH = 30;
  const cardH = Math.max(fromH, toContentH);

  y = ensure(y, cardH + 8);

  // FROM
  sf(cLight);
  doc.roundedRect(fromX, y, cardW, cardH, 2.5, 2.5, "F");
  tl("FROM", fromX + 4, 6.5, cGray, true);
  doc.setFontSize(11);
  st(cDark);
  doc.setFont("helvetica", "bold");
  doc.text("SP NET INC", fromX + 4, y + 6);
  doc.setFontSize(6.5);
  st(cGray);
  doc.setFont("helvetica", "normal");
  doc.text("Administrative Billing System", fromX + 4, y + 10.5);
  doc.text("SP NET GRAM ADMIN PANEL", fromX + 4, y + 14.5);
  doc.text("support@sp-net.in", fromX + 4, y + 18.5);
  doc.text("www.sp-net.in", fromX + 4, y + 22.5);
  doc.setFontSize(5.5);
  st(cMuted);
  doc.text("Organization · Support · Billing", fromX + 4, y + 28.5);

  // TO
  sf(cLight);
  doc.roundedRect(toX, y, cardW, cardH, 2.5, 2.5, "F");
  tl("BILL TO", toX + 4, 6.5, cGray, true);

  let ils = y + 4;
  toItems.forEach((it) => {
    doc.setFontSize(5.5);
    st(cGray);
    doc.setFont("helvetica", "bold");
    doc.text(it.label, toX + 4, ils);
    doc.setFontSize(6.5);
    st(cBody);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(it.value, valMaxW);
    lines.forEach((line: string, i: number) => {
      doc.text(line, toX + 22, ils + i * 3.5);
    });
    ils += Math.max(lines.length * 3.5 + 0.5, 5);
  });

  y = y + cardH + 6;

  // ─────────────────────────────────────────────────────────────
  // INVOICE DETAILS
  // ─────────────────────────────────────────────────────────────
  y = ensure(y, 22);
  hr(y);
  y += 3;
  sf(cLight);
  doc.rect(m, y, cw, 15, "F");

  const dd = [
    { label: "Invoice Number", value: data.invoiceNumber },
    { label: "Type", value: data.type },
    { label: "Category", value: data.category || "—" },
    { label: "Issued", value: formatDate(data.issuedAt) },
    { label: "Due", value: data.dueAt ? formatDate(data.dueAt) : "—" },
    { label: "Paid", value: data.paidAt ? formatDate(data.paidAt) : "—" },
  ];
  const dw = cw / 3;
  dd.forEach((d, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const dx = m + col * dw;
    const dy = y + row * 7.5;
    doc.setFontSize(5.5);
    st(cGray);
    doc.setFont("helvetica", "bold");
    doc.text(d.label, dx + 3, dy + 1.5);
    doc.setFontSize(7);
    st(cBody);
    doc.setFont("helvetica", "normal");
    doc.text(d.value, dx + 3, dy + 5.5);
  });
  y += 17;

  if (data.license) {
    y = ensure(y, 10);
    hr(y);
    y += 3;
    doc.setFontSize(5.5);
    st(cGray);
    doc.setFont("helvetica", "bold");
    doc.text("License", m, y);
    doc.setFontSize(7);
    st(cBody);
    doc.setFont("helvetica", "normal");
    doc.text(data.license.key, m + 14, y);
    doc.setFontSize(5.5);
    st(cMuted);
    doc.setFont("helvetica", "normal");
    doc.text(`Plan: ${data.license.plan}`, m + 14 + doc.getTextWidth(data.license.key) + 6, y);
    y += 7;
  }

  // ─────────────────────────────────────────────────────────────
  // LINE ITEMS TABLE
  // ─────────────────────────────────────────────────────────────
  y = ensure(y, 12);
  hr(y);
  y += 4;

  const cd = [
    { x: m, w: cw * 0.44 },
    { x: m + cw * 0.44, w: cw * 0.14 },
    { x: m + cw * 0.58, w: cw * 0.18 },
    { x: m + cw * 0.76, w: cw * 0.24 },
  ];

  sf(cDark);
  doc.roundedRect(m, y - 2, cw, 6.5, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Description", cd[0].x + 2, y + 1.5);
  doc.text("Qty", cd[1].x + cd[1].w - 2, y + 1.5, { align: "right" });
  doc.text("Unit Price", cd[2].x + cd[2].w - 2, y + 1.5, { align: "right" });
  doc.text("Total", cd[3].x + cd[3].w - 2, y + 1.5, { align: "right" });
  y += 8.5;

  data.lineItems.forEach((item, idx) => {
    y = ensure(y, 10);
    if (idx % 2 === 0) { sf(cLight); doc.rect(m, y - 2, cw, 6.5, "F"); }
    doc.setFontSize(7);
    st(cBody);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(item.description, cd[0].w - 4);
    descLines.forEach((line: string, i: number) => {
      doc.text(line, cd[0].x + 2, y + i * 3.5);
    });
    const rowH = Math.max(descLines.length * 3.5 + 0.5, 6.5);
    tr(String(item.quantity), cd[1].x + cd[1].w - 2, 7, cBody, false);
    tr(fmtCents(item.unitPrice), cd[2].x + cd[2].w - 2, 7, cBody, false);
    doc.setFont("helvetica", "bold");
    tr(fmtCents(item.total), cd[3].x + cd[3].w - 2, 7, cBody, true);
    y += rowH;
  });

  if (data.lineItems.length === 0) {
    y += 7;
  }

  // ─────────────────────────────────────────────────────────────
  // FINANCIAL SUMMARY — full-width, labels left, values right
  // ─────────────────────────────────────────────────────────────
  y = ensure(y, 54);
  y += 3;
  sf(cLight);
  doc.roundedRect(m, y, cw, 42, 2.5, 2.5, "F");

  const lx = m + 6;
  const vx = pw - m - 6;

  doc.setFontSize(6);
  st(cGray);
  doc.setFont("helvetica", "bold");
  doc.text("FINANCIAL SUMMARY", lx, y + 4.5);

  const finRows = [
    { label: "Subtotal", value: fmtCents(data.subtotal) },
    { label: "Discount", value: data.discount > 0 ? `-${fmtCents(data.discount)}` : "$0.00" },
    { label: "Tax", value: data.tax > 0 ? fmtCents(data.tax) : "$0.00" },
    { label: "Additional Charges", value: "$0.00" },
  ];

  let fy = y + 11;
  finRows.forEach((r) => {
    doc.setFontSize(7);
    st(cGray);
    doc.setFont("helvetica", "normal");
    doc.text(r.label, lx, fy);
    tr(r.value, vx, 7, cBody, false);
    fy += 6;
  });

  // Separator line
  sd(cDark);
  doc.setLineWidth(0.4);
  doc.line(lx, fy + 1, vx, fy + 1);
  fy += 5;

  // Grand Total box — right-aligned, width 100mm
  const gtW = 100;
  const gtX = vx - gtW;
  sf(cDark);
  doc.roundedRect(gtX, fy, gtW, 9, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", gtX + 6, fy + 5.5);
  tr(fmtCents(data.total), vx, 10, "#ffffff", true);

  y += 48;

  // ─────────────────────────────────────────────────────────────
  // PAYMENT + AUDIT
  // ─────────────────────────────────────────────────────────────
  y = ensure(y, 30);
  y += 2;
  const subCardW = cw / 2 - 3;
  const payAuditH = 22;

  sf(cLight);
  doc.roundedRect(m, y, subCardW, payAuditH, 2.5, 2.5, "F");
  doc.setFontSize(6);
  st(cGray);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT INFORMATION", m + 4, y + 3.5);

  [
    { label: "Status", value: data.status },
    { label: "Settlement", value: data.status === "PAID" ? "Settled" : data.status === "PENDING" ? "Awaiting Payment" : data.status },
    { label: "Generated By", value: data.actorName || data.actorEmail || "System" },
    { label: "Generated Date", value: formatDateTime(new Date(data.issuedAt)) },
  ].forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = m + 4 + col * (subCardW / 2 - 2);
    const py = y + 3.5 + 4 + row * 6;
    doc.setFontSize(5); st(cGray); doc.setFont("helvetica", "bold");
    doc.text(p.label, px, py);
    doc.setFontSize(6); st(cBody); doc.setFont("helvetica", "normal");
    doc.text(p.value, px, py + 3);
  });

  const auditX = m + subCardW + 6;
  sf(cLight);
  doc.roundedRect(auditX, y, subCardW, payAuditH, 2.5, 2.5, "F");
  doc.setFontSize(6);
  st(cGray);
  doc.setFont("helvetica", "bold");
  doc.text("AUDIT & SECURITY", auditX + 4, y + 3.5);

  [
    { label: "Generated By", value: data.actorName || data.actorEmail || "System" },
    { label: "Generated At", value: formatDateTime(new Date(data.issuedAt)) },
    { label: "Source", value: "SP NET GRAM ADMIN" },
    { label: "Invoice ID", value: data.invoiceNumber },
  ].forEach((a, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = auditX + 4 + col * (subCardW / 2 - 2);
    const py = y + 3.5 + 4 + row * 6;
    doc.setFontSize(5); st(cGray); doc.setFont("helvetica", "bold");
    doc.text(a.label, px, py);
    doc.setFontSize(6); st(cBody); doc.setFont("helvetica", "normal");
    doc.text(a.value, px, py + 3);
  });

  y += payAuditH + 5;

  // ─────────────────────────────────────────────────────────────
  // NOTES
  // ─────────────────────────────────────────────────────────────
  if (data.notes) {
    y = ensure(y, 22);
    hr(y);
    y += 3.5;
    doc.setFontSize(6);
    st(cGray);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", m, y);
    y += 4.5;
    doc.setFontSize(6.5);
    st(cBody);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(data.notes || "", cw - 8);
    noteLines.forEach((line: string) => {
      doc.text(line, m + 4, y);
      y += 4;
    });
    y += 3;
  }

  // ─────────────────────────────────────────────────────────────
  // FOOTER with QR
  // ─────────────────────────────────────────────────────────────
  y = ensure(y, 30);
  const ft = ph - 24;

  sf(cDark);
  doc.rect(0, ft, pw, 24, "F");
  sf(cAccent);
  doc.rect(0, ft, pw, 1, "F");

  const qrSize = 14;
  try {
    const qrUrl = await qrcode.toDataURL(
      JSON.stringify({ id: data.invoiceNumber, invoice: data.invoiceNumber, system: "SP_NET_GRAM_ADMIN" }),
      { width: 200, margin: 1, color: { dark: "#ffffff", light: "#0f172a" } },
    );
    doc.addImage(qrUrl, "PNG", pw - m - qrSize, ft + 5, qrSize, qrSize);
  } catch {
    // silent
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("© 2026 SP NET INC. All Rights Reserved.", pw / 2, ft + 7.5, { align: "center" });

  doc.setFontSize(5.5);
  doc.setTextColor(cMuted);
  doc.text("SP NET GRAM ADMIN PANEL  |  support@sp-net.in  |  www.sp-net.in", pw / 2, ft + 13, { align: "center" });

  doc.setFontSize(5);
  doc.setTextColor("#475569");
  doc.text(`Invoice #${data.invoiceNumber}  ·  Generated ${formatDateTime(new Date(data.issuedAt))}`, pw / 2, ft + 18.5, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
