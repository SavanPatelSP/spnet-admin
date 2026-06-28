"use client";

import { useState, useMemo, memo, type ReactNode } from "react";
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from "lucide-react";
import { cn } from "@/lib/shared";
import { EmptyState } from "@/components/ui/EmptyState";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
}

interface Row {
  id: string;
  values: Record<string, unknown>;
  cells: ReactNode[];
}

interface DataTableProps {
  columns: Column[];
  rows: Row[];
  onRowClick?: (id: string) => void;
  pageSize?: number;
  emptyMessage?: string;
  searchPlaceholder?: string;
  className?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  bulkActions?: ReactNode;
  exportable?: boolean;
  onExport?: () => void;
  exportActions?: ReactNode;
  filters?: ReactNode;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
}

export const DataTable = memo(function DataTable({
  columns,
  rows,
  onRowClick,
  pageSize = 10,
  emptyMessage = "No data found.",
  searchPlaceholder = "Search...",
  className,
  selectable,
  selectedIds,
  onSelectionChange,
  bulkActions,
  exportable,
  onExport,
  exportActions,
  filters,
  emptyIcon,
  emptyTitle,
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(pageSize);

  const searchableColumnKeys = useMemo(() => columns.filter((c) => c.searchable).map((c) => c.key), [columns]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      searchableColumnKeys.some((key) => {
        const val = row.values[key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [rows, search, searchableColumnKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a.values[sortKey];
      const bVal = b.values[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string" ? aVal.localeCompare(String(bVal)) : Number(aVal) - Number(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const sortIcons = useMemo(() => {
    const icons: Record<string, ReactNode> = {};
    for (const col of columns) {
      if (!col.sortable) continue;
      if (sortKey !== col.key) icons[col.key] = <ArrowUpDown size={14} className="ml-1 inline opacity-30 group-hover/sort:opacity-60" />;
      else icons[col.key] = sortDir === "asc" ? <ArrowUp size={14} className="ml-1 inline text-blue-400" /> : <ArrowDown size={14} className="ml-1 inline text-blue-400" />;
    }
    return icons;
  }, [columns, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * perPage, (safePage + 1) * perPage);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleSelect(id: string) {
    if (!selectedIds || !onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  function toggleAll() {
    if (!selectedIds || !onSelectionChange) return;
    if (selectedIds.size === paged.length && paged.length > 0) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(paged.map((r) => r.id)));
    }
  }

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      const start = Math.max(1, safePage - 1);
      const end = Math.min(totalPages - 2, safePage + 1);
      if (start > 1) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 2) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages;
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg", className)}>
      <div className="space-y-3 border-b border-zinc-800/50 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full sm:w-72 rounded-lg border border-zinc-700/50 bg-zinc-800/30 py-2 pl-10 pr-8 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-600 focus:bg-zinc-800/50"
              aria-label={searchPlaceholder}
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(0); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:text-zinc-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectable && selectedIds && selectedIds.size > 0 && (
              <span className="text-sm font-medium text-blue-400">{selectedIds.size} selected</span>
            )}
            {bulkActions && selectable && selectedIds && selectedIds.size > 0 && (
              <div className="flex items-center gap-2">{bulkActions}</div>
            )}
            {exportable && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700/50 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Export data"
              >
                <Download size={14} />
                Export
              </button>
            )}
            {exportActions}
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
              className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-2 py-1.5 text-sm text-zinc-400 outline-none transition-colors focus:border-zinc-600"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
        {filters && <div className="flex items-center gap-2">{filters}</div>}
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/50">
              {selectable && (
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selectedIds?.size === paged.length}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-600"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "group/sort p-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500",
                    col.sortable && "cursor-pointer select-none hover:text-zinc-300",
                    col.className,
                  )}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  scope="col"
                  tabIndex={col.sortable ? 0 : undefined}
                  onKeyDown={(e) => { if (col.sortable && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleSort(col.key); } }}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortIcons[col.key]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {paged.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "transition-colors duration-150",
                  onRowClick ? "cursor-pointer hover:bg-zinc-800/20" : "hover:bg-zinc-800/10",
                )}
                onClick={() => onRowClick?.(row.id)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => { if (onRowClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(row.id); } }}
              >
                {selectable && (
                  <td className="w-10 p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(row.id) ?? false}
                      onChange={() => toggleSelect(row.id)}
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-600"
                      aria-label={`Select row ${row.id}`}
                    />
                  </td>
                )}
                {row.cells.map((cell, i) => (
                  <td key={columns[i]?.key ?? i} className={cn("p-3 text-sm", columns[i]?.className)}>
                    {cell ?? <span className="text-zinc-600">-</span>}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  {search.trim() ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50">
                        <Search size={20} className="text-zinc-500" />
                      </div>
                      <p className="text-sm font-medium text-zinc-400">No results found</p>
                      <p className="mt-1 text-sm text-zinc-600">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <EmptyState
                      title={emptyTitle || "No data found"}
                      description={emptyMessage}
                      icon={emptyIcon}
                      className="border-0 bg-transparent py-16"
                    />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800/50 px-5 py-3">
          <div className="flex items-center gap-1">
            <button
              disabled={safePage === 0}
              onClick={() => setPage(0)}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-sm text-zinc-600">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                    p === safePage
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
                  )}
                >
                  {p + 1}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
