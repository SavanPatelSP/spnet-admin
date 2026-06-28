"use client";

import { useState, useCallback, useEffect } from "react";
import { Bell, CheckCheck, Archive, Trash2, ChevronLeft, ChevronRight, Filter, Inbox, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/dates";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
}

const CATEGORIES = ["All", "Security", "Approvals", "Premium", "Economy", "Licenses", "Organizations", "Moderation", "Support", "System"] as const;

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  LOW: "bg-green-500/10 text-green-400 border-green-500/20",
};

const CATEGORY_ICONS: Record<string, string> = {
  Security: "🔒",
  Approvals: "✅",
  Premium: "⭐",
  Economy: "💰",
  Licenses: "🔑",
  Organizations: "🏢",
  Moderation: "🛡️",
  Support: "🎫",
  System: "⚙️",
};

export function NotificationCenter({ memberId, initialUnread, initialTotal }: { memberId: string; initialUnread: number; initialTotal: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [category, setCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifs = useCallback(async (p: number, cat: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
      if (cat) params.set("category", cat);
      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
      setNotifications(data.notifications);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const refreshCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?pageSize=1&archived=all");
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
        setTotal(data.total);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifs(page, category);
  }, [page, category, fetchNotifs]);

  const markRead = useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id, read: true }) });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  const archive = useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id, archive: true }) });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(t => t - 1);
      refreshCounts();
    } catch {}
  }, [refreshCounts]);

  const deleteNotif = useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: id }) });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(t => t - 1);
      refreshCounts();
    } catch {}
  }, [refreshCounts]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Inbox size={18} className="text-zinc-400" />
          <h2 className="text-lg font-bold text-zinc-100">Inbox</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              {unreadCount} unread
            </span>
          )}
          <span className="text-xs text-zinc-600">{total} total</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setPage(1); fetchNotifs(1, category); }} className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700" title="Refresh">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-zinc-700">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-zinc-800 px-6 py-3 overflow-x-auto scrollbar-thin">
        <Filter size={14} className="shrink-0 text-zinc-500" />
        {CATEGORIES.map(c => {
          const active = category === (c === "All" ? "" : c);
          return (
            <button key={c} onClick={() => { setCategory(c === "All" ? "" : c); setPage(1); }}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active ? "bg-blue-500/10 text-blue-400" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="divide-y divide-zinc-800/50">
        {loading && notifications.length === 0 ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex h-20 animate-pulse items-center gap-4 px-6 py-4">
                <div className="h-8 w-8 rounded-full bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-zinc-800" />
                  <div className="h-3 w-96 rounded bg-zinc-800/50" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={() => fetchNotifs(page, category)} className="mt-2 text-xs text-blue-400 hover:underline">Retry</button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-zinc-500">
            <Bell size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`group relative flex items-start gap-4 px-6 py-4 transition-colors hover:bg-zinc-800/20 ${!n.read ? "bg-blue-500/[2%]" : ""}`}>
              {!n.read && <span className="absolute left-2 top-6 h-2 w-2 rounded-full bg-blue-400" />}
              <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs ${PRIORITY_COLORS[n.priority] || "bg-zinc-800 text-zinc-500"}`}>
                {CATEGORY_ICONS[n.category] || "📋"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.read ? "font-semibold text-zinc-100" : "text-zinc-300"}`}>{n.title}</p>
                  <span className="shrink-0 text-[10px] text-zinc-600">{formatDateTime(n.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-600 whitespace-pre-line">{n.message}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">{n.category}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[n.priority] || "bg-zinc-800 text-zinc-500"}`}>{n.priority}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="rounded-lg p-1.5 text-blue-400 hover:bg-zinc-800" title="Mark read">
                    <CheckCheck size={14} />
                  </button>
                )}
                <button onClick={() => archive(n.id)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300" title="Archive">
                  <Archive size={14} />
                </button>
                <button onClick={() => deleteNotif(n.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-zinc-800" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30">
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30">
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
