"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/Skeleton";
import { Clock, Circle, XCircle, User, Monitor } from "lucide-react";

interface Session {
  id: string;
  teamMemberId: string;
  teamMember: { name: string; email: string } | null;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  const d = new Date(dateStr);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function truncateUA(ua: string | null, max = 60): string {
  if (!ua) return "-";
  return ua.length > max ? ua.slice(0, max) + "..." : ua;
}

export function SessionActivityTimeline() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_ROUTES.TEAM_MEMBERS.SESSIONS_LIST}?limit=10`);
        if (!res.ok) throw new Error("Failed to load sessions");
        const json = await res.json();
        setSessions(json.sessions || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function revoke(id: string) {
    if (!confirm("Revoke this session?")) return;
    await fetch(API_ROUTES.TEAM_MEMBERS.SESSIONS_REVOKE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: id }),
    });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock size={16} className="text-blue-400" />
          <h2 className="text-lg font-bold text-zinc-100">Recent Session Activity</h2>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock size={16} className="text-blue-400" />
          <h2 className="text-lg font-bold text-zinc-100">Recent Session Activity</h2>
        </div>
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock size={16} className="text-blue-400" />
          <h2 className="text-lg font-bold text-zinc-100">Recent Session Activity</h2>
        </div>
        <p className="text-sm text-zinc-500">No sessions found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Clock size={16} className="text-blue-400" />
        <h2 className="text-lg font-bold text-zinc-100">Recent Session Activity</h2>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-[7px] top-1 h-[calc(100%-8px)] w-0.5 bg-zinc-800" />

        <div className="space-y-4">
          {sessions.map((s) => {
            const isActive = new Date(s.expiresAt) > new Date();
            return (
              <div key={s.id} className="relative">
                <div className="absolute -left-[22px] top-1">
                  {isActive ? (
                    <Circle size={14} className="text-green-400" fill="currentColor" fillOpacity={0.3} />
                  ) : (
                    <XCircle size={14} className="text-zinc-500" />
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-sm font-medium text-zinc-200">
                        <User size={12} className="text-zinc-500" />
                        {s.teamMember?.name || s.teamMember?.email || "Unknown"}
                      </span>
                      <span className="text-[10px] text-zinc-500">{relativeTime(s.createdAt)}</span>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-400">
                      <span className="font-mono">{s.ipAddress || "-"}</span>
                      <span className="flex items-center gap-1">
                        <Monitor size={10} />
                        {truncateUA(s.userAgent)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isActive ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                        Expired
                      </span>
                    )}
                    {isActive && (
                      <button
                        onClick={() => revoke(s.id)}
                        className="rounded-lg bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <a
        href="/sessions"
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
      >
        View all sessions &rarr;
      </a>
    </div>
  );
}
