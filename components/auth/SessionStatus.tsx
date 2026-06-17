"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut, Shield, KeyRound, AlertTriangle } from "lucide-react";

export function SessionStatus() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-700" />
      </div>
    );
  }

  if (!session?.user) return null;

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const licenseStatus = session.user.licenseStatus;
  const licenseOk = licenseStatus === "ACTIVE";

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-zinc-800"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {initials}
        </div>
        <div className="hidden text-left md:block">
          <p className="text-sm font-medium text-zinc-200">{session.user.name}</p>
          <p className="text-xs text-zinc-500">{session.user.role}</p>
        </div>
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <div className="border-b border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {initials}
                </div>
                <div>
                  <p className="font-medium text-zinc-200">{session.user.name}</p>
                  <p className="text-sm text-zinc-500">{session.user.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1 p-2">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
                <Shield size={16} className="text-zinc-500" />
                <span className="text-zinc-400">Role:</span>
                <span className="ml-auto font-medium text-zinc-200">{session.user.role}</span>
              </div>
              {session.user.licensePlan && (
                <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
                  <KeyRound size={16} className="text-zinc-500" />
                  <span className="text-zinc-400">Plan:</span>
                  <span className="ml-auto font-medium text-zinc-200">{session.user.licensePlan}</span>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
                {licenseOk ? (
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                ) : (
                  <AlertTriangle size={16} className="text-yellow-500" />
                )}
                <span className="text-zinc-400">License:</span>
                <span className={`ml-auto font-medium ${licenseOk ? "text-green-400" : "text-yellow-400"}`}>
                  {licenseStatus || "N/A"}
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-800 p-2">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-zinc-800"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
