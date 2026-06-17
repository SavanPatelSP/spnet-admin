"use client";

import { X } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSelect {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterSelect[];
  onClear: () => void;
}

export function FilterBar({ filters, onClear }: FilterBarProps) {
  const hasActive = filters.some((f) => f.value);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {hasActive && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  );
}
