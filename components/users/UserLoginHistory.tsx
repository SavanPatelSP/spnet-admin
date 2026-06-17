"use client";

import { useState, useEffect, useMemo } from "react";
import { FilterBar } from "@/components/ui/FilterBar";
import { formatDateTime } from "@/lib/shared";
import { API_ROUTES } from "@/lib/constants";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface LoginEntry {
  id: string;
  createdAt: Date | string;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
}

interface Props {
  teamMemberId: string;
  initialLogs?: LoginEntry[];
}

export function UserLoginHistory({ teamMemberId, initialLogs }: Props) {
  const [logs, setLogs] = useState<LoginEntry[]>(initialLogs ?? []);
  const [loading, setLoading] = useState(!initialLogs);
  const [statusFilter, setStatusFilter] = useState("");

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.TEAM_MEMBERS.LOGIN_HISTORY}?teamMemberId=${teamMemberId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? data ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (!initialLogs) {
        fetchLogs();
      }
    }, 0);
    return () => clearTimeout(t);
  }, [teamMemberId]);

  const filtered = useMemo(() => {
    if (!statusFilter) return logs;
    return logs.filter((l) => (statusFilter === "success" ? l.success : !l.success));
  }, [logs, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
          <Clock size={32} className="text-zinc-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-300">No Login History</h3>
        <p className="mt-2 max-w-md text-sm text-zinc-500">No login attempts recorded for this user.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Login History</h2>
      <FilterBar
        filters={[
          {
            key: "status",
            label: "All Results",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Success", value: "success" },
              { label: "Failure", value: "failure" },
            ],
          },
        ]}
        onClear={() => setStatusFilter("")}
      />
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/40">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">Date / Time</th>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">IP Address</th>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">User Agent</th>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">Success</th>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">Failure Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/20">
                  <td className="p-4 text-sm text-zinc-400">{formatDateTime(entry.createdAt)}</td>
                  <td className="p-4 text-sm text-zinc-300">{entry.ipAddress}</td>
                  <td className="p-4 text-sm text-zinc-400 max-w-xs truncate">{entry.userAgent}</td>
                  <td className="p-4">
                    {entry.success ? (
                      <CheckCircle size={18} className="text-green-400" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )}
                  </td>
                  <td className="p-4 text-sm text-zinc-400">{entry.failureReason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
