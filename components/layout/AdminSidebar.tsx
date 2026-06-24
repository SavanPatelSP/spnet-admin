"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/shared";
import { APP_NAME } from "@/lib/constants";
import { SIDEBAR_PAGES } from "@/lib/sidebar";
import { APP_VERSION, APP_BUILD } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface AdminSidebarProps {
  permissions: string[];
}

const groups = [
  {
    label: "Operations",
    pageKeys: ["dashboard", "licenses", "premium", "plan-overview", "approvals", "coins", "gems", "offers", "waitlist"],
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
    pageKeys: ["security-center", "audit-logs", "security", "moderation"],
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

export default function AdminSidebar({ permissions }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visiblePages = useMemo(() => {
    return new Set(
      SIDEBAR_PAGES
        .filter((p) => !p.permission || permissions.includes(p.permission))
        .map((p) => p.key)
    );
  }, [permissions]);

  return (
    <aside
      className={cn(
        "flex min-h-screen flex-col border-r border-zinc-800/50 bg-zinc-950 transition-all duration-300",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-800/50 px-6 py-5">
        <div className={cn("overflow-hidden transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
          <h1 className="whitespace-nowrap text-xl font-bold tracking-tight text-zinc-100">{APP_NAME}</h1>
          <p className="mt-0.5 whitespace-nowrap text-xs text-zinc-600">Admin Panel</p>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "shrink-0 rounded-lg p-2 transition-colors",
            "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300",
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {groups.map((group) => {
          const items = group.pageKeys
            .map((key) => pageMap.get(key))
            .filter((p): p is NonNullable<typeof p> => !!p && visiblePages.has(p.key));
          if (items.length === 0) return null;

          return (
            <div key={group.label} className="mb-5">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-blue-600/15 text-blue-400"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-blue-500" />
                      )}
                      <Icon size={18} className="shrink-0" />
                      <span className={cn("truncate transition-all duration-300", collapsed ? "w-0 opacity-0" : "opacity-100")}>
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
      <div className="border-t border-zinc-800/50 p-4">
        <p className="text-center text-[11px] text-zinc-700">
          {collapsed ? `v${APP_VERSION}` : `${APP_NAME} v${APP_VERSION} (${APP_BUILD})`}
        </p>
      </div>
    </aside>
  );
}
