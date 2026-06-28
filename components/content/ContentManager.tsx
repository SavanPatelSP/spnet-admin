"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, FileText, Trash2, ArrowUpDown } from "lucide-react";
import { WorkflowBadge } from "./WorkflowBadge";
import type { ContentItem, WorkflowState } from "@/lib/content";
import { formatDateTime } from "@/lib/shared";

const STATUS_TABS: { label: string; value: WorkflowState | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
];

export function ContentManager({ initialData, initialTotal }: { initialData: ContentItem[]; initialTotal: number }) {
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WorkflowState | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/content/list?${params}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
        setTotal(json.total);
      }
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status !== "ALL") params.set("status", status);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        const res = await fetch(`/api/content/list?${params}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setItems(json.data);
          setTotal(json.total);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
     
  }, [search, status, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
      fetchItems();
    }
  }

  async function handleTransition(id: string, action: string) {
    const res = await fetch(`/api/content/${id}/${action}`, { method: "POST" });
    if (res.ok) {
      router.refresh();
      fetchItems();
    }
  }

  function nextAction(item: ContentItem): { label: string; action: string } | null {
    if (item.status === "DRAFT") return { label: "Submit for Review", action: "review" };
    if (item.status === "IN_REVIEW") return { label: "Publish", action: "publish" };
    if (item.status === "PUBLISHED") return { label: "Archive", action: "archive" };
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search content..."
            className="w-72 rounded-2xl border border-zinc-700 bg-zinc-800/50 py-2 pl-10 pr-4 text-sm outline-none focus:border-zinc-500"
          />
        </div>
        <Link
          href="/content/new"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
        >
          <Plus size={18} />
          Create New
        </Link>
      </div>

      <div className="flex gap-1 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              status === tab.value
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/50 p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <FileText size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300">No content found</h3>
          <p className="mt-2 text-sm text-zinc-500">Create your first piece of content to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800">
            {items.map((item) => {
              const action = nextAction(item);
              return (
                <div key={item.id} className="flex items-center gap-4 p-5 transition-colors hover:bg-zinc-800/30">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                      <FileText size={20} className="text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/content/${item.id}`} className="text-sm font-semibold text-zinc-100 hover:text-blue-400">
                        {item.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                        <span>{item.author}</span>
                        <span className="text-zinc-700">|</span>
                        <span>{item.category}</span>
                        <span className="text-zinc-700">|</span>
                        <span>{formatDateTime(item.updatedAt)}</span>
                        <span className="text-zinc-700">|</span>
                        <span>v{item.version}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <WorkflowBadge status={item.status} />
                    {action && (
                      <button
                        onClick={() => handleTransition(item.id, action.action)}
                        className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                      >
                        {action.label}
                      </button>
                    )}
                    <Link
                      href={`/content/${item.id}`}
                      className="rounded-xl border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="rounded-xl border border-zinc-700 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">{total} total items</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
