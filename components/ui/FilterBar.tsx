"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/shared";

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
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-3 py-1.5 text-sm text-zinc-300 outline-none transition-colors focus:border-zinc-600"
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
          className={cn(
            "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
            "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300",
          )}
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  );
}
