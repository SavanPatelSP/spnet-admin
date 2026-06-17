"use client";

import { Bell } from "lucide-react";
import { SessionStatus } from "@/components/auth/SessionStatus";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { Tooltip } from "@/components/ui/Tooltip";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="hidden md:block">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-3">
          <Tooltip content="Notifications">
            <button className="relative rounded-2xl border border-zinc-800 bg-zinc-900 p-2.5 transition-colors hover:bg-zinc-800">
              <Bell size={18} />
            </button>
          </Tooltip>
          <SessionStatus />
        </div>
      </div>
    </header>
  );
}
