"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

interface LoginEntry {
  id: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  teamMember: { name: string; email: string } | null;
}

export function RecentLoginAttempts({ loginHistory }: { loginHistory: LoginEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? loginHistory : loginHistory.slice(0, 8);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">Recent Login Attempts</h2>
        <span className="text-xs text-zinc-500">{loginHistory.length} total</span>
      </div>
      <div className="space-y-2">
        {displayed.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 rounded-xl border border-zinc-800/50 bg-zinc-800/30 p-3 transition-colors hover:bg-zinc-800/50"
          >
            {entry.success ? (
              <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-500" />
            ) : (
              <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200">
                  {entry.teamMember?.name || entry.teamMember?.email || "Unknown"}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  entry.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                }`}>
                  {entry.success ? "Success" : "Failed"}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                <span>{entry.ipAddress || "-"}</span>
                {entry.failureReason && <span className="text-red-400/70">{entry.failureReason}</span>}
                <span className="inline-flex items-center gap-1">
                  <Clock size={10} />
                  {(() => {
                    const d = new Date(entry.createdAt);
                    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const h = d.getHours(), m = d.getMinutes();
                    const h12 = h % 12 || 12;
                    const ampm = h < 12 ? "am" : "pm";
                    return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${h12}:${m < 10 ? "0" + m : m} ${ampm}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        ))}
        {loginHistory.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full rounded-xl bg-zinc-800/50 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-zinc-800"
          >
            {showAll ? "Show less" : `Show all ${loginHistory.length} attempts`}
          </button>
        )}
      </div>
    </div>
  );
}
