"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/shared";
import { APP_NAME } from "@/lib/constants";

import {
  LayoutDashboard,
  KeyRound,
  Monitor,
  ClipboardList,
  Users,
  BarChart3,
  CreditCard,
  Crown,
  Megaphone,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useState } from "react";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: KeyRound, label: "Licenses", href: "/licenses" },
  { icon: Monitor, label: "Devices", href: "/devices" },
  { icon: ClipboardList, label: "Audit Logs", href: "/audit-logs" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: Shield, label: "Security", href: "/security" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: CreditCard, label: "Revenue", href: "/revenue" },
  { icon: Crown, label: "Premium", href: "/premium" },
  { icon: Megaphone, label: "Broadcasts", href: "/broadcasts" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex min-h-screen flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 p-6">
        <div className={cn("overflow-hidden", collapsed ? "w-0" : "w-auto")}>
          <h1 className="whitespace-nowrap text-2xl font-black tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 whitespace-nowrap text-sm text-zinc-500">Enterprise Control Center</p>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              <span className={cn("truncate font-medium transition-opacity", collapsed ? "w-0 opacity-0" : "opacity-100")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <p className={cn("text-center text-xs text-zinc-600", collapsed ? "" : "")}>
          {collapsed ? `v1` : `${APP_NAME} Admin v1.0`}
        </p>
      </div>
    </aside>
  );
}
