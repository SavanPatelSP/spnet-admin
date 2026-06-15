"use client";

import { Bell, Search, ChevronDown, Settings, LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/shared";
import { APP_NAME, ADMIN_NAME } from "@/lib/constants";

export default function AdminHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            placeholder="Search licenses, devices, users..."
            className="w-80 rounded-2xl border border-zinc-700 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-zinc-500 focus:bg-zinc-900"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-2.5 transition-colors hover:bg-zinc-800">
            <Bell size={18} />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">3</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 transition-colors hover:bg-zinc-800"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 font-bold text-sm">
                {ADMIN_NAME.charAt(0)}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-tight">{ADMIN_NAME}</p>
                <p className="text-[11px] leading-tight text-zinc-500">{APP_NAME} Administrator</p>
              </div>
              <ChevronDown size={16} className={cn("text-zinc-500 transition-transform", menuOpen && "rotate-180")} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl">
                <div className="border-b border-zinc-800 px-3 py-3">
                  <p className="text-sm font-medium">{ADMIN_NAME}</p>
                  <p className="text-xs text-zinc-500">{APP_NAME} Administrator</p>
                </div>
                <div className="mt-1 space-y-1">
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
                    <User size={16} /> Profile
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
                    <Settings size={16} /> Settings
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
