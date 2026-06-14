"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Shield,
  Crown,
  CreditCard,
  Megaphone,
  UserCog,
  KeyRound,
  UsersRound,
  Monitor,
  ClipboardList,
  Settings,
} from "lucide-react";

const items = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
  },

  {
    icon: KeyRound,
    label: "Licenses",
    href: "/licenses",
  },

  {
    icon: Monitor,
    label: "Devices",
    href: "/devices",
  },

  {
    icon: ClipboardList,
    label: "Audit Logs",
    href: "/audit-logs",
  },

  {
    icon: Users,
    label: "Users",
    href: "/users",
  },

  {
    icon: UsersRound,
    label: "Team Members",
    href: "/team-members",
  },

  {
    icon: UserCog,
    label: "Roles",
    href: "/roles",
  },

  {
    icon: Shield,
    label: "Owner",
    href: "/owner",
  },

  {
    icon: KeyRound,
    label: "Security Policies",
    href: "/security-policies",
  },

  {
    icon: BarChart3,
    label: "Analytics",
    href: "/analytics",
  },

  {
    icon: CreditCard,
    label: "Revenue",
    href: "/revenue",
  },

  {
    icon: Crown,
    label: "Premium",
    href: "/premium",
  },

  {
    icon: Megaphone,
    label: "Broadcasts",
    href: "/broadcasts",
  },

  {
    icon: FileText,
    label: "Reports",
    href: "/reports",
  },

  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-zinc-800 bg-zinc-950 min-h-screen">
      <div className="border-b border-zinc-800 p-6">
        <h1 className="text-2xl font-black tracking-tight">
          SP-NET
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Enterprise Control Center
        </p>
      </div>

      <nav className="p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(
              item.href + "/"
            );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                transition-all
                duration-200
                ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                }
              `}
            >
              <Icon size={20} />

              <span className="font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
