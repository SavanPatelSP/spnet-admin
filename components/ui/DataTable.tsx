"use client";

import { useState, useMemo, ReactNode } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/shared";

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
  filters?: ReactNode;
}

export function DataTable({
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
  filters,
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

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ArrowUpDown size={14} className="ml-1 inline opacity-40" />;
    return sortDir === "asc" ? <ArrowUp size={14} className="ml-1 inline text-blue-400" /> : <ArrowDown size={14} className="ml-1 inline text-blue-400" />;
  };

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl", className)}>
      <div className="space-y-3 border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="w-72 rounded-2xl border border-zinc-700 bg-zinc-800/50 py-2 pl-10 pr-4 text-sm outline-none focus:border-zinc-500"
              aria-label={searchPlaceholder}
            />
          </div>
          <div className="flex items-center gap-3">
            {selectable && selectedIds && selectedIds.size > 0 && (
              <span className="text-sm text-zinc-400">{selectedIds.size} selected</span>
            )}
            {bulkActions && selectable && selectedIds && selectedIds.size > 0 && (
              <div className="flex items-center gap-2">{bulkActions}</div>
            )}
            {exportable && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Export data"
              >
                <Download size={14} />
                Export
              </button>
            )}
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-400 outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <p className="text-sm text-zinc-500">
              {sorted.length} result{sorted.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {filters && <div className="flex items-center">{filters}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          <thead className="border-b border-zinc-800 bg-zinc-950/40">
            <tr>
              {selectable && (
                <th className="w-10 p-4">
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
                    "p-4 text-left text-sm font-medium text-zinc-400",
                    col.sortable && "cursor-pointer select-none hover:text-zinc-200",
                    col.className,
                  )}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  scope="col"
                  tabIndex={col.sortable ? 0 : undefined}
                  onKeyDown={(e) => { if (col.sortable && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleSort(col.key); } }}
                >
                  {col.label}
                  {col.sortable && <SortIcon columnKey={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-zinc-800 transition-colors",
                  onRowClick ? "cursor-pointer hover:bg-zinc-800/30" : "hover:bg-zinc-800/20",
                )}
                onClick={() => onRowClick?.(row.id)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => { if (onRowClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(row.id); } }}
              >
                {selectable && (
                  <td className="w-10 p-4" onClick={(e) => e.stopPropagation()}>
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
                  <td key={columns[i]?.key ?? i} className={cn("p-4", columns[i]?.className)}>
                    {cell ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="p-10 text-center text-zinc-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
          <button
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {safePage + 1} of {totalPages}
          </span>
          <button
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30"
            aria-label="Next page"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
