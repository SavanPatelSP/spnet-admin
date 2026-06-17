"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/shared";
import { APP_NAME } from "@/lib/constants";


import {
  LayoutDashboard,
  KeyRound,
  Crown,
  Coins,
  Gem,
  Users,
  UserCog,
  UserCheck,
  UserPlus,
  Building2,
  BarChart3,
  CreditCard,
  FileText,
  ClipboardList,
  Shield,
  Megaphone,
  FileEdit,
  Settings,
  LifeBuoy,
  Activity,
  ChevronLeft,
  ChevronRight,
  FileWarning,
  Monitor,
  Server,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
  permission?: string;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

interface AdminSidebarProps {
  permissions: string[];
}

const groups: SidebarGroup[] = [
  {
    label: "Operations",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: KeyRound, label: "Licenses", href: "/licenses", permission: "View Licenses" },
      { icon: Crown, label: "Premium", href: "/premium", permission: "View Premium" },
      { icon: Coins, label: "Coins", href: "/coins", permission: "View Coin Balances" },
      { icon: Gem, label: "Gems", href: "/gems", permission: "View Gem Balances" },
    ],
  },
  {
    label: "Administration",
    items: [
      { icon: Users, label: "Users", href: "/users", permission: "View Users" },
      { icon: UserCheck, label: "User Lifecycle", href: "/users/lifecycle", permission: "User Lifecycle Management" },
      { icon: UserCog, label: "Roles", href: "/settings/roles", permission: "View Roles" },
      { icon: UserPlus, label: "Team Members", href: "/settings/team-members", permission: "View Team Members" },
      { icon: Building2, label: "Organizations", href: "/organizations", permission: "View Organizations" },
      { icon: Monitor, label: "Devices", href: "/devices", permission: "View Devices" },
    ],
  },
  {
    label: "Insights",
    items: [
      { icon: BarChart3, label: "Analytics", href: "/analytics", permission: "View Analytics" },
      { icon: CreditCard, label: "Revenue", href: "/revenue", permission: "View Revenue" },
      { icon: FileText, label: "Reports", href: "/reports", permission: "View Reports" },
    ],
  },
  {
    label: "Security",
    items: [
      { icon: ClipboardList, label: "Audit Logs", href: "/audit-logs", permission: "View Audit Logs" },
      { icon: Shield, label: "Security", href: "/security", permission: "View Security Policies" },
      { icon: FileWarning, label: "Moderation", href: "/moderation", permission: "Moderate Content" },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: Megaphone, label: "Broadcasts", href: "/broadcasts", permission: "View Broadcasts" },
      { icon: FileEdit, label: "Content", href: "/content", permission: "View Content" },
    ],
  },
  {
    label: "Support",
    items: [
      { icon: LifeBuoy, label: "Support / Tickets", href: "/support", permission: "View Tickets" },
    ],
  },
  {
    label: "Settings",
    items: [
      { icon: Settings, label: "General", href: "/settings", permission: "Access Settings" },
      { icon: ClipboardList, label: "Audit", href: "/settings/audit", permission: "View Audit Logs" },
      { icon: KeyRound, label: "Licensing", href: "/settings/licensing", permission: "View Licenses" },
      { icon: Lock, label: "Security", href: "/settings/security", permission: "View Security Policies" },
      { icon: Server, label: "System", href: "/settings/system", permission: "Edit System Settings" },
      { icon: Activity, label: "System Health", href: "/system-health" },
    ],
  },
];

function filterItems(items: SidebarItem[], permissions: string[]): SidebarItem[] {
  return items.filter((item) => {
    if (!item.permission) return true;
    return permissions.includes(item.permission);
  });
}

export default function AdminSidebar({ permissions }: AdminSidebarProps) {
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
      <nav className="flex-1 overflow-y-auto p-4">
        {groups.map((group) => {
          const visibleItems = filterItems(group.items, permissions);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-6">
              {!collapsed && (
                <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
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
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800 p-4">
        <p className={cn("text-center text-xs text-zinc-600")}>
          {collapsed ? `v1` : `${APP_NAME} Admin v1.0`}
        </p>
      </div>
    </aside>
  );
}
