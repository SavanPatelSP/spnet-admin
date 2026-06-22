"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, formatPrice } from "@/lib/shared";
import { API_ROUTES } from "@/lib/constants";
import {
  RefreshCw, Trash2, CheckCircle, Clock, AlertCircle, XCircle, RotateCcw,
  FileText, Eye, Search, TrendingUp, DollarSign, FileSpreadsheet, Printer,
  Share2, Archive, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  type: string;
  category: string | null;
  action: string | null;
  total: number;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  organization: string | null;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  isArchived: boolean;
  license: { key: string; organization: string; plan: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  OVERDUE: "bg-red-500/10 text-red-400 border-red-500/20",
  CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  REFUNDED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ARCHIVED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const CATEGORY_STYLES: Record<string, string> = {
  PREMIUM: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  LICENSE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COIN: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  GEM: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PROMOTION: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  ORGANIZATION: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  SESSION: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  OTHER: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.DRAFT}`}>
      {status === "PAID" && <CheckCircle size={12} />}
      {status === "PENDING" && <Clock size={12} />}
      {status === "OVERDUE" && <AlertCircle size={12} />}
      {status === "CANCELLED" && <XCircle size={12} />}
      {status === "REFUNDED" && <RotateCcw size={12} />}
      {status === "ARCHIVED" && <Archive size={12} />}
      {status}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_STYLES[category] || CATEGORY_STYLES.OTHER}`}>
      {category}
    </span>
  );
}

export function InvoicesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  const fetchInvoices = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const url = new URL(API_ROUTES.INVOICES.LIST, window.location.origin);
      url.searchParams.set("page", String(p));
      url.searchParams.set("pageSize", "100");
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load invoices");
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchInvoices(page);
  }, [fetchInvoices, page]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (!includeArchived && inv.isArchived) return false;
      if (statusFilter && inv.status !== statusFilter) return false;
      if (categoryFilter && inv.category !== categoryFilter) return false;
      if (typeFilter && inv.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (inv.customerName?.toLowerCase().includes(q) ?? false) ||
          (inv.customerEmail?.toLowerCase().includes(q) ?? false) ||
          (inv.organization?.toLowerCase().includes(q) ?? false) ||
          (inv.license?.organization?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [invoices, search, statusFilter, categoryFilter, typeFilter, includeArchived]);

  const stats = useMemo(() => {
    const active = filtered.filter((i) => !i.isArchived);
    const totalRevenue = active.filter((i) => ["PAID", "PENDING"].includes(i.status)).reduce((s, i) => s + i.total, 0);
    const outstanding = active.filter((i) => ["PENDING", "OVERDUE"].includes(i.status)).reduce((s, i) => s + i.total, 0);
    const paidCount = active.filter((i) => i.status === "PAID").length;
    const overdueCount = active.filter((i) => i.status === "OVERDUE").length;
    return { totalRevenue, outstanding, paidCount, overdueCount };
  }, [filtered]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      const res = await fetch(API_ROUTES.INVOICES.UPDATE(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status, paidAt: status === "PAID" ? new Date().toISOString() : inv.paidAt } : inv)));
      showToast("Invoice updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed", "error");
    }
  }, [showToast]);

  const deleteInvoice = useCallback(async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      const res = await fetch(API_ROUTES.INVOICES.DELETE(id), { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Delete failed");
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      showToast("Invoice deleted", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }, [showToast]);

  const archiveInvoice = useCallback(async (id: string, isArchived: boolean) => {
    try {
      const res = await fetch(API_ROUTES.INVOICES.UPDATE(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Archive failed");
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, isArchived: data.invoice.isArchived } : inv)));
      showToast(isArchived ? "Invoice archived" : "Invoice restored", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Archive failed", "error");
    }
  }, [showToast]);

  const columns = useMemo(
    () => [
      { key: "invoiceNumber", label: "Invoice #", sortable: true, searchable: true },
      { key: "customer", label: "Customer", sortable: true, searchable: true },
      { key: "category", label: "Category", sortable: true },
      { key: "status", label: "Status", sortable: true },
      { key: "total", label: "Total", sortable: true },
      { key: "issuedAt", label: "Issued", sortable: true },
      { key: "actions", label: "Actions" },
    ],
    []
  );

  const rows = useMemo(
    () =>
      filtered.map((inv) => ({
        id: inv.id,
        values: {
          invoiceNumber: inv.invoiceNumber,
          customer: inv.customerName || inv.organization || inv.license?.organization || "—",
          category: inv.category || "OTHER",
          status: inv.status,
          total: inv.total,
          issuedAt: inv.issuedAt,
        },
        cells: [
          <button
            key="num"
            onClick={() => router.push(`/invoices/${inv.id}`)}
            className="font-mono text-sm text-blue-400 hover:text-blue-300"
          >
            {inv.invoiceNumber}
          </button>,
          <div key="cust" className="text-sm">
            <p className="text-zinc-200">{inv.customerName || inv.organization || inv.license?.organization || "—"}</p>
            {inv.customerEmail && <p className="text-xs text-zinc-500">{inv.customerEmail}</p>}
          </div>,
          <div key="cat" className="flex items-center gap-2">
            <CategoryBadge category={inv.category || "OTHER"} />
            {inv.action && <span className="text-[10px] text-zinc-500">{inv.action.replace(/_/g, " ")}</span>}
          </div>,
          <span key="status"><StatusBadge status={inv.status} /></span>,
          <span key="total" className="text-sm font-medium text-zinc-200">
            {formatPrice(inv.total / 100, "$")}
          </span>,
          <span key="issued" className="text-sm text-zinc-400">
            {formatDateTime(inv.issuedAt)}
          </span>,
          <div key="actions" className="flex items-center gap-1">
            <button
              onClick={() => router.push(`/invoices/${inv.id}`)}
              className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400 hover:bg-blue-500/20"
              title="Open"
            >
              <Eye size={14} />
            </button>
            <select
              value={inv.status}
              onChange={(e) => updateStatus(inv.id, e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-blue-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button
              onClick={() => archiveInvoice(inv.id, !inv.isArchived)}
              className="rounded-lg bg-yellow-500/10 p-1.5 text-yellow-400 hover:bg-yellow-500/20"
              title={inv.isArchived ? "Restore" : "Archive"}
            >
              <Archive size={14} />
            </button>
            <button
              onClick={() => deleteInvoice(inv.id)}
              className="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>,
        ],
      })),
    [filtered, router, updateStatus, deleteInvoice, archiveInvoice]
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Invoices"
        description="Manage customer invoices, share links, exports and analytics."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/invoices/analytics")}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              <TrendingUp size={16} /> Analytics
            </button>
            <button
              onClick={() => fetchInvoices(page)}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Revenue" value={formatPrice(stats.totalRevenue / 100, "$")} icon={DollarSign} color="green" />
        <StatCard title="Outstanding" value={formatPrice(stats.outstanding / 100, "$")} icon={Clock} color="yellow" />
        <StatCard title="Paid" value={stats.paidCount} icon={CheckCircle} color="blue" />
        <StatCard title="Overdue" value={stats.overdueCount} icon={AlertCircle} color={stats.overdueCount > 0 ? "red" : "default"} />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices, customers, organizations..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-blue-500"
            />
            Include archived
          </label>
        </div>

        <FilterBar
          filters={[
            {
              key: "status",
              label: "All Statuses",
              value: statusFilter,
              onChange: setStatusFilter,
              options: ["DRAFT", "PENDING", "PAID", "OVERDUE", "CANCELLED", "REFUNDED", "ARCHIVED"].map((s) => ({ label: s, value: s })),
            },
            {
              key: "category",
              label: "All Categories",
              value: categoryFilter,
              onChange: setCategoryFilter,
              options: ["PREMIUM", "LICENSE", "COIN", "GEM", "PROMOTION", "ORGANIZATION", "SESSION", "OTHER"].map((c) => ({ label: c, value: c })),
            },
            {
              key: "type",
              label: "All Types",
              value: typeFilter,
              onChange: setTypeFilter,
              options: ["SALE", "REFUND", "CREDIT"].map((t) => ({ label: t, value: t })),
            },
          ]}
          onClear={() => { setStatusFilter(""); setCategoryFilter(""); setTypeFilter(""); }}
        />

        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={rows}
            searchPlaceholder="Search invoices..."
            emptyMessage="No matching invoices."
          />
          {total > 100 && (
            <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm text-zinc-500">
                Page {page} of {Math.max(1, Math.ceil(total / 100))} ({total} total)
              </span>
              <button
                disabled={page >= Math.ceil(total / 100)}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
