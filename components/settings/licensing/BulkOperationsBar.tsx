"use client";

import { useState } from "react";
import { cn } from "@/lib/shared";
import { X, CalendarPlus, Ban, ArrowUpDown, Building2, Loader2 } from "lucide-react";

interface BulkOperationsBarProps {
  selectedCount: number;
  onClear: () => void;
  onExtend?: (ids: string[]) => Promise<void>;
  onRevoke?: (ids: string[]) => Promise<void>;
  onUpdatePlan?: (ids: string[]) => Promise<void>;
  onAssignOrg?: (ids: string[]) => Promise<void>;
  className?: string;
}

export function BulkOperationsBar({
  selectedCount,
  onClear,
  onExtend,
  onRevoke,
  onUpdatePlan,
  onAssignOrg,
  className,
}: BulkOperationsBarProps) {
  const [loading, setLoading] = useState<string | null>(null);

  if (selectedCount === 0) return null;

  async function handleAction(action: string, fn?: (ids: string[]) => Promise<void>) {
    if (!fn) return;
    setLoading(action);
    try {
      await fn([]);
    } finally {
      setLoading(null);
    }
  }

  const actions = [
    { key: "extend", label: "Extend", icon: CalendarPlus, fn: onExtend, color: "text-blue-400 hover:bg-blue-500/10" },
    { key: "revoke", label: "Revoke", icon: Ban, fn: onRevoke, color: "text-red-400 hover:bg-red-500/10" },
    { key: "plan", label: "Update Plan", icon: ArrowUpDown, fn: onUpdatePlan, color: "text-purple-400 hover:bg-purple-500/10" },
    { key: "org", label: "Assign Org", icon: Building2, fn: onAssignOrg, color: "text-green-400 hover:bg-green-500/10" },
  ];

  return (
    <>
      <div className={cn("hidden items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2 md:flex", className)}>
        <span className="text-sm font-medium text-zinc-300">{selectedCount} selected</span>
        <div className="mx-2 h-5 w-px bg-zinc-700" />
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => handleAction(a.key, a.fn)}
            disabled={loading === a.key}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
              a.color,
            )}
          >
            {loading === a.key ? <Loader2 size={14} className="animate-spin" /> : <a.icon size={14} />}
            {a.label}
          </button>
        ))}
        <div className="ml-2 flex-1" />
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <X size={14} /> Clear
        </button>
      </div>

      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur-lg md:hidden",
        className,
      )}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-300">{selectedCount} selected</span>
          <button onClick={onClear} className="rounded-lg p-2 text-zinc-500 transition-colors hover:text-zinc-300">
            <X size={18} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => handleAction(a.key, a.fn)}
              disabled={loading === a.key}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition-colors disabled:opacity-50",
                a.color.replace("hover:bg-", "bg-").replace("/10", "/5"),
              )}
              style={{ minHeight: 44 }}
            >
              {loading === a.key ? <Loader2 size={18} className="animate-spin" /> : <a.icon size={18} />}
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
