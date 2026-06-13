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
} from "lucide-react";

const items = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
  },

  {
    icon: Shield,
    label: "Owner",
    href: "/owner",
  },

  {
    icon: Users,
    label: "Users",
    href: "/users",
  },

  {
    icon: FileText,
    label: "Reports",
    href: "/reports",
  },

  {
    icon: BarChart3,
    label: "Analytics",
    href: "/analytics",
  },

  {
    icon: Crown,
    label: "Premium",
    href: "/premium",
  },

  {
    icon: CreditCard,
    label: "Revenue",
    href: "/revenue",
  },

  {
    icon: Megaphone,
    label: "Broadcasts",
    href: "/broadcasts",
  },

  {
    icon: KeyRound,
    label: "Licenses",
    href: "/licenses",
  },

  {
    icon: UserCog,
    label: "Roles",
    href: "/roles",
  },

  {
    icon: KeyRound,
    label: "Security Policies",
    href: "/security-policies",
  },

  {
    icon: UsersRound,
    label: "Team Members",
    href: "/team-members",
  },

  {
    icon: FileText,
    label: "Audit Logs",
    href: "/audit-logs",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-zinc-800 bg-zinc-950 min-h-screen">

      <div className="p-6 border-b border-zinc-800">

        <h1 className="text-2xl font-black">
          SP-NET
        </h1>

        <p className="text-sm text-zinc-500 mt-1">
          Enterprise Control Center
        </p>

      </div>

      <nav className="p-4 space-y-2">

        {items.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href;

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
                ${
                  active
                    ? "bg-blue-600 text-white"
                    : "hover:bg-zinc-900 text-zinc-300"
                }
              `}
            >
              <Icon size={20} />

              <span>
                {item.label}
              </span>
            </Link>
          );
        })}

      </nav>

    </aside>
  );
}
