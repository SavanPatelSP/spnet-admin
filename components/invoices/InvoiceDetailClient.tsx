"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { API_ROUTES } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/shared";
import {
  ArrowLeft, Download, Printer, Share2, FileText, Edit3,
  Archive, ArchiveRestore, CheckCircle, Clock, AlertCircle,
  Copy, FileSpreadsheet, XCircle,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  category: string | null;
  action: string | null;
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
  targetName: string | null;
  targetId: string | null;
  lineItems: string | null;
  notes: string | null;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  isArchived: boolean;
  shareToken: string | null;
  shareTokenExpiresAt: string | null;
  license: { key: string; organization: string; plan: string; teamMember: { name: string; email: string } | null } | null;
}

interface AuditEvent {
  id: string;
  action: string;
  description: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
}

interface Props {
  invoice: Invoice;
  auditHistory: AuditEvent[];
}

export default function InvoiceDetailClient({ invoice: initialInvoice, auditHistory }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [editOpen, setEditOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const lineItems = useMemo(() => {
    if (!invoice.lineItems) return [];
    try {
      return JSON.parse(invoice.lineItems);
    } catch {
      return [];
    }
  }, [invoice.lineItems]);

  async function updateStatus(status: string) {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.INVOICES.UPDATE(invoice.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      setInvoice({ ...invoice, status, paidAt: status === "PAID" ? new Date().toISOString() : invoice.paidAt });
      showToast("Status updated", "success");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleArchive() {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.INVOICES.UPDATE(invoice.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !invoice.isArchived }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Archive failed");
      setInvoice({ ...invoice, isArchived: data.invoice.isArchived, archivedAt: data.invoice.archivedAt });
      showToast(invoice.isArchived ? "Invoice restored" : "Invoice archived", "success");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Archive failed", "error");
    } finally {
      setLoading(false);
    }
  }

  async function generateShareLink() {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Share failed");
      setShareLink(data.link);
      setShareOpen(true);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Share failed", "error");
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    const headers = ["Description", "Quantity", "Unit Price", "Total"];
    const rows = lineItems.map((item: any) => [
      item.description,
      item.quantity,
      (item.unitPrice / 100).toFixed(2),
      (item.total / 100).toFixed(2),
    ]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.invoiceNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV downloaded", "success");
  }

  async function downloadPDF() {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("PDF downloaded", "success");
    } catch {
      showToast("Failed to generate PDF", "error");
    }
  }

  function printInvoice() {
    window.print();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard", "success"));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`${invoice.type} invoice for ${invoice.category || "OTHER"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="secondary" onClick={() => router.push("/invoices")}>
              <ArrowLeft size={14} /> Back
            </ActionButton>
            <ActionButton variant="secondary" onClick={downloadCSV}>
              <FileSpreadsheet size={14} /> CSV
            </ActionButton>
            <ActionButton variant="secondary" onClick={downloadPDF}>
              <FileText size={14} /> PDF
            </ActionButton>
            <ActionButton variant="secondary" onClick={printInvoice}>
              <Printer size={14} /> Print
            </ActionButton>
            <ActionButton variant="secondary" onClick={generateShareLink} loading={loading}>
              <Share2 size={14} /> Share
            </ActionButton>
            <ActionButton variant="secondary" onClick={() => setEditOpen(true)}>
              <Edit3 size={14} /> Edit
            </ActionButton>
            <ActionButton variant={invoice.isArchived ? "primary" : "danger"} onClick={toggleArchive} loading={loading}>
              {invoice.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
              {invoice.isArchived ? "Restore" : "Archive"}
            </ActionButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div ref={printRef} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{invoice.invoiceNumber}</h2>
                <p className="mt-1 text-sm text-zinc-400">{invoice.type} &middot; {invoice.category || "OTHER"}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={invoice.status} />
                {invoice.isArchived && <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Archived</span>}
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Billed To</p>
                <p className="font-medium text-zinc-200">{invoice.customerName || invoice.organization || invoice.license?.organization || "—"}</p>
                <p className="text-sm text-zinc-400">{invoice.customerEmail}</p>
                {invoice.organization && <p className="text-sm text-zinc-500">{invoice.organization}</p>}
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Actor / Target</p>
                <p className="text-sm text-zinc-400">Actor: {invoice.actorName || invoice.actorEmail || "—"}</p>
                <p className="text-sm text-zinc-400">Target: {invoice.targetName || invoice.targetId || "—"}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-zinc-500">License</p>
                {invoice.license ? (
                  <>
                    <p className="font-medium text-zinc-200">{invoice.license.key}</p>
                    <p className="text-sm text-zinc-400">{invoice.license.organization} &middot; {invoice.license.plan}</p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">No license attached</p>
                )}
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Dates</p>
                <p className="text-sm text-zinc-400">Issued: {formatDateTime(invoice.issuedAt)}</p>
                <p className="text-sm text-zinc-400">Due: {invoice.dueAt ? formatDateTime(invoice.dueAt) : "—"}</p>
                <p className="text-sm text-zinc-400">Paid: {invoice.paidAt ? formatDateTime(invoice.paidAt) : "—"}</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-500">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-zinc-500">No line items</td></tr>
                ) : lineItems.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-zinc-800">
                    <td className="py-3 text-zinc-200">{item.description}</td>
                    <td className="py-3 text-right text-zinc-400">{item.quantity}</td>
                    <td className="py-3 text-right text-zinc-400">{formatPrice(item.unitPrice / 100, "$")}</td>
                    <td className="py-3 text-right font-medium text-zinc-200">{formatPrice(item.total / 100, "$")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatPrice(invoice.subtotal / 100, "$")}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Discounts</span>
                <span>{formatPrice(invoice.discount / 100, "$")}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Taxes</span>
                <span>{formatPrice(invoice.tax / 100, "$")}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 pt-2 text-lg font-bold text-white">
                <span>Final Total</span>
                <span>{formatPrice(invoice.total / 100, "$")}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-sm text-zinc-400">
                <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Notes</p>
                {invoice.notes}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Audit History</h3>
            <div className="space-y-3">
              {auditHistory.length === 0 ? (
                <p className="text-sm text-zinc-500">No audit events found.</p>
              ) : auditHistory.map((event) => (
                <div key={event.id} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
                  <Clock size={14} className="mt-0.5 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{event.action}</p>
                    <p className="text-xs text-zinc-400">{event.description}</p>
                    <p className="mt-1 text-[10px] text-zinc-600">{event.actorEmail} &middot; {formatDateTime(event.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Status Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {["DRAFT", "PENDING", "PAID", "OVERDUE", "CANCELLED", "REFUNDED"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={invoice.status === s || loading}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    invoice.status === s
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  } disabled:opacity-50`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Timeline</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-zinc-400">
                <CheckCircle size={14} className="text-emerald-400" />
                <span>Created {formatDateTime(invoice.createdAt)}</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-400">
                <Clock size={14} className="text-blue-400" />
                <span>Issued {formatDateTime(invoice.issuedAt)}</span>
              </li>
              {invoice.paidAt && (
                <li className="flex items-center gap-3 text-zinc-400">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span>Paid {formatDateTime(invoice.paidAt)}</span>
                </li>
              )}
              {invoice.isArchived && invoice.archivedAt && (
                <li className="flex items-center gap-3 text-zinc-400">
                  <Archive size={14} className="text-yellow-400" />
                  <span>Archived {formatDateTime(invoice.archivedAt)}</span>
                </li>
              )}
              <li className="flex items-center gap-3 text-zinc-400">
                <AlertCircle size={14} className="text-zinc-500" />
                <span>Updated {formatDateTime(invoice.updatedAt)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share Invoice"
        description="Anyone with this link can view the invoice."
        size="md"
        footer={<ActionButton onClick={() => setShareOpen(false)} variant="secondary">Close</ActionButton>}
      >
        {shareLink ? (
          <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-3">
            <input readOnly value={shareLink} className="flex-1 bg-transparent text-xs text-zinc-300 outline-none" />
            <button onClick={() => copy(shareLink)} className="rounded-lg bg-blue-500/10 p-2 text-blue-400 hover:bg-blue-500/20">
              <Copy size={14} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Generating share link...</p>
        )}
      </Modal>

      <EditInvoiceModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        invoice={invoice}
        onUpdated={(updated) => { setInvoice(updated); router.refresh(); }}
      />
    </div>
  );
}

function EditInvoiceModal({ open, onClose, invoice, onUpdated }: { open: boolean; onClose: () => void; invoice: Invoice; onUpdated: (i: Invoice) => void }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState(invoice.customerName || "");
  const [customerEmail, setCustomerEmail] = useState(invoice.customerEmail || "");
  const [organization, setOrganization] = useState(invoice.organization || "");
  const [notes, setNotes] = useState(invoice.notes || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.INVOICES.UPDATE(invoice.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, customerEmail, organization, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      onUpdated(data.invoice);
      showToast("Invoice updated", "success");
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Metadata"
      description="Update invoice customer details and notes."
      size="md"
        footer={
          <>
            <ActionButton onClick={onClose} variant="secondary">Cancel</ActionButton>
            <ActionButton onClick={() => { const form = document.getElementById("edit-invoice") as HTMLFormElement | null; form?.requestSubmit(); }} loading={loading} variant="primary">Save</ActionButton>
          </>
        }
      >
        <form id="edit-invoice" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Customer Name</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Customer Email</label>
          <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Organization</label>
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none" />
        </div>
      </form>
    </Modal>
  );
}
