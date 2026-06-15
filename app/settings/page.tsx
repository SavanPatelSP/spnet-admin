import Link from "next/link";
import {
  Shield,
  Users,
  KeyRound,
  FileText,
  Server,
  Settings,
  AlertTriangle,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

const sections = [
  {
    title: "Team Management",
    description:
      "Manage members, ownership transfers, role assignments and access.",
    href: "/settings/team-members",
    icon: Users,
  },
  {
    title: "Roles & Permissions",
    description:
      "Create roles, manage permission matrix and access hierarchy.",
    href: "/settings/roles",
    icon: KeyRound,
  },
  {
    title: "Security Center",
    description:
      "MFA, IP allowlists, lockdown controls and security posture.",
    href: "/settings/security",
    icon: Shield,
  },
  {
    title: "Licensing Defaults",
    description:
      "Templates, grace periods, limits and activation policies.",
    href: "/settings/licensing",
    icon: Settings,
  },
  {
    title: "System Administration",
    description:
      "Platform health, backups, maintenance mode and environment.",
    href: "/settings/system",
    icon: Server,
  },
  {
    title: "Audit Configuration",
    description:
      "Retention policies, exports, alerts and compliance settings.",
    href: "/settings/audit",
    icon: FileText,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              Enterprise Control Center
            </h1>

            <p className="mt-3 max-w-3xl text-zinc-400">
              Centralized management for security,
              access control, licensing, compliance
              and platform administration.
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-green-400">
            Operational
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-3">
            <Activity size={20} />
            <span className="text-zinc-500">
              Security Status
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-green-400">
            Protected
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-3">
            <Users size={20} />
            <span className="text-zinc-500">
              Access Control
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold">
            Active
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-3">
            <Shield size={20} />
            <span className="text-zinc-500">
              Audit Logging
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-blue-400">
            Enabled
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-3">
            <Server size={20} />
            <span className="text-zinc-500">
              Platform Health
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-green-400">
            Healthy
          </h2>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-blue-500 hover:bg-zinc-800"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400">
                <Icon size={24} />
              </div>

              <h2 className="text-xl font-semibold">
                {section.title}
              </h2>

              <p className="mt-3 text-sm text-zinc-500">
                {section.description}
              </p>

              <div className="mt-5 text-sm font-medium text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                Open →
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-3xl border border-red-900 bg-red-950/20 p-6">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="text-red-400" />

          <h2 className="text-xl font-semibold text-red-400">
            Danger Zone
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <button className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white">
            Emergency Lockdown
          </button>

          <button className="rounded-xl bg-yellow-600 px-4 py-3 font-medium text-white">
            Revoke All Sessions
          </button>

          <button className="rounded-xl bg-zinc-700 px-4 py-3 font-medium text-white">
            Export Audit Logs
          </button>
        </div>

        <p className="mt-4 text-sm text-zinc-500">
          Restricted to OWNER and SUPER_ADMIN roles.
        </p>
      </div>
    </div>
  );
}
