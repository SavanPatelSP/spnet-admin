"use client";

import { Plus, Minus } from "lucide-react";

interface ChangeEntry {
  field: string;
  before: string;
  after: string;
}

interface ChangesComparisonProps {
  changes: ChangeEntry[];
}

export function ChangesComparison({ changes }: ChangesComparisonProps) {
  if (!changes || changes.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-zinc-300">Changes</h4>
      <div className="overflow-hidden rounded-xl border border-zinc-700/50">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Field</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Before</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {changes.map((change, i) => (
              <tr key={i} className="transition-colors hover:bg-zinc-800/20">
                <td className="px-3 py-2.5 font-medium text-zinc-300">{change.field}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-red-400">
                    <Minus size={10} />
                    {change.before}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-green-400">
                    <Plus size={10} />
                    {change.after}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
