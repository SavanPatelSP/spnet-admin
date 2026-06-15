"use client";

import { Bell } from "lucide-react";
import { SessionStatus } from "@/components/auth/SessionStatus";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="relative hidden md:block">
          <input
            placeholder="Search licenses, devices, users..."
            className="w-80 rounded-2xl border border-zinc-700 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-zinc-500 focus:bg-zinc-900"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-2.5 transition-colors hover:bg-zinc-800">
            <Bell size={18} />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">3</span>
          </button>
          <SessionStatus />
        </div>
      </div>
    </header>
  );
}
