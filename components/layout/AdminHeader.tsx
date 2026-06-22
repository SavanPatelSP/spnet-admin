"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { SessionStatus } from "@/components/auth/SessionStatus";
import { SessionCountdown } from "@/components/auth/SessionCountdown";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { Tooltip } from "@/components/ui/Tooltip";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function AdminHeader() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="hidden md:block">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-3">
          <SessionCountdown />
          <div className="relative">
            <Tooltip content="Notifications">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-2.5 transition-colors hover:bg-zinc-800"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </Tooltip>
            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                  <h3 className="text-sm font-semibold text-zinc-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <CheckCheck size={12} />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-500">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`border-b border-zinc-800/50 p-4 transition-colors hover:bg-zinc-800/30 ${!n.read ? "bg-blue-500/5" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.read ? "font-semibold text-zinc-100" : "text-zinc-300"}`}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 whitespace-pre-line">{n.message}</p>
                          </div>
                          {!n.read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <SessionStatus />
        </div>
      </div>
    </header>
  );
}
