"use client";

import { useState, useEffect, use } from "react";
import { formatDateTime, formatPrice } from "@/lib/shared";
import { Shield, AlertCircle, Loader2 } from "lucide-react";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default function ShareInvoicePage({ params }: SharePageProps) {
  const { token } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invoices/share/view?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInvoice(data.invoice);
        else setError(data.error || "Invoice not found");
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-900 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
          <h1 className="text-xl font-bold text-white">Invoice Unavailable</h1>
          <p className="mt-2 text-sm text-zinc-400">{error || "This invoice is no longer shared."}</p>
        </div>
      </div>
    );
  }

  const lineItems = invoice.lineItems ? JSON.parse(invoice.lineItems) : [];

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-500" />
            <h1 className="text-lg font-bold">Shared Invoice</h1>
          </div>
          <span className="text-xs text-zinc-500">View-only</span>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{invoice.invoiceNumber}</h2>
              <p className="mt-1 text-sm text-zinc-400">{invoice.type} &middot; {invoice.category}</p>
            </div>
            <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-300">
              {invoice.status}
            </span>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Billed To</p>
              <p className="font-medium">{invoice.customerName || invoice.organization || "—"}</p>
              <p className="text-zinc-500">{invoice.customerEmail}</p>
            </div>
            <div>
              <p className="text-zinc-500">Issued</p>
              <p className="font-medium">{formatDateTime(invoice.issuedAt)}</p>
              <p className="text-zinc-500">Due {invoice.dueAt ? formatDateTime(invoice.dueAt) : "—"}</p>
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
              {lineItems.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-zinc-800">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">{formatPrice(item.unitPrice / 100, "$")}</td>
                  <td className="py-3 text-right">{formatPrice(item.total / 100, "$")}</td>
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
              <span>Discount</span>
              <span>{formatPrice(invoice.discount / 100, "$")}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Tax</span>
              <span>{formatPrice(invoice.tax / 100, "$")}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-2 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(invoice.total / 100, "$")}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4 text-sm text-zinc-400">
              {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
