"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/shared";
import { Clock, Shield, AlertTriangle, LogOut, ChevronDown } from "lucide-react";

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

async function revokeAndLogout() {
  try {
    await fetch("/api/sessions/revoke-current", { method: "POST" });
  } catch {
    // best effort
  }
  signOut({ callbackUrl: "/login?expired=1" });
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error("Session expired");
  return data.session;
};

export function SessionCountdown() {
  const { data, error, mutate } = useSWR("/api/sessions/me", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    onError: () => revokeAndLogout(),
  });

  const [remaining, setRemaining] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.addEventListener("session-updated", () => mutate());
    return () => window.removeEventListener("session-updated", () => mutate());
  }, [mutate]);

  useEffect(() => {
    if (!data?.expiresAt) return;
    const target = new Date(data.expiresAt).getTime();
    function tick() {
      const seconds = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds <= 0) {
        revokeAndLogout();
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.expiresAt]);

  if (error || !data?.expiresAt) return null;

  const warning = remaining < 300;
  const critical = remaining < 60;
  const statusLabel = critical ? "Critical" : warning ? "Warning" : "Active";
  const riskLabel = critical ? "High" : warning ? "Medium" : "Low";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors md:px-3",
          critical
            ? "border-red-500/30 bg-red-500/10 text-red-400"
            : warning
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800",
        )}
      >
        <Clock size={13} className="hidden sm:block" />
        <span className="font-mono">{formatTime(remaining)}</span>
        <span
          className={cn(
            "hidden h-2 w-2 rounded-full md:block",
            critical ? "bg-red-500 animate-pulse" : warning ? "bg-yellow-500 animate-pulse" : "bg-green-500",
          )}
        />
        <ChevronDown size={13} className={cn("hidden transition-transform md:block", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="border-b border-zinc-800 p-4">
              <p className="text-sm font-semibold text-zinc-200">Session Status</p>
              <p className="mt-1 text-xs text-zinc-500">Server-driven session expiration.</p>
            </div>
            <div className="space-y-1 p-2">
              <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Clock size={14} /> Remaining
                </span>
                <span className="font-mono font-medium text-zinc-200">{formatTime(remaining)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-zinc-400">
                  <Shield size={14} /> Status
                </span>
                <span className={cn("font-medium", critical ? "text-red-400" : warning ? "text-yellow-400" : "text-green-400")}>
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-zinc-400">
                  <AlertTriangle size={14} /> Risk
                </span>
                <span className={cn("font-medium", critical ? "text-red-400" : warning ? "text-yellow-400" : "text-green-400")}>
                  {riskLabel}
                </span>
              </div>
            </div>
            <div className="border-t border-zinc-800 p-2">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-zinc-800"
              >
                <LogOut size={14} />
                Sign Out Now
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
