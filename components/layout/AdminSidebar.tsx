"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/shared";
import { APP_NAME } from "@/lib/constants";
import { SIDEBAR_PAGES } from "@/lib/sidebar";
import { APP_VERSION, APP_BUILD } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface AdminSidebarProps {
  permissions: string[];
}

const groups = [
  {
    label: "Operations",
    pageKeys: ["dashboard", "licenses", "premium", "plan-overview", "coins", "gems", "offers"],
  },
  {
    label: "Administration",
    pageKeys: ["users", "roles", "team-members", "organizations", "devices", "session-operations"],
  },
  {
    label: "Insights",
    pageKeys: ["analytics", "revenue", "reports"],
  },
  {
    label: "Security",
    pageKeys: ["audit-logs", "security", "moderation"],
  },
  {
    label: "Communication",
    pageKeys: ["broadcasts", "content"],
  },
  {
    label: "Support",
    pageKeys: ["support"],
  },
  {
    label: "Settings",
    pageKeys: [
      "settings",
      "invoices",
      "settings-audit",
      "settings-licensing",
      "settings-security",
      "settings-system",
      "system-health",
    ],
  },
];

const pageMap = new Map(SIDEBAR_PAGES.map((p) => [p.key, p]));

function filterVisiblePages(permissions: string[]) {
  return SIDEBAR_PAGES.filter((p) => {
    if (!p.permission) return true;
    return permissions.includes(p.permission);
  });
}


export default function AdminSidebar({ permissions }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const visiblePages = new Set(filterVisiblePages(permissions).map((p) => p.key));

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
          <p className="mt-1 whitespace-nowrap text-sm text-zinc-500">Admin Panel</p>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        {groups.map((group) => {
          const items = group.pageKeys
            .map((key) => pageMap.get(key))
            .filter((p): p is NonNullable<typeof p> => !!p && visiblePages.has(p.key));
          if (items.length === 0) return null;

          return (
            <div key={group.label} className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
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
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <p className={cn("text-center text-xs text-zinc-600")}>
          {collapsed ? `${APP_VERSION}` : `${APP_NAME} Admin ${APP_VERSION} (${APP_BUILD})`}
        </p>
      </div>
    </aside>
  );
}
