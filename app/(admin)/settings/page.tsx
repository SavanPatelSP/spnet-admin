import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Shield, Users, KeyRound, FileText, Server, Settings as SettingsIcon, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

export const dynamic = "force-dynamic";

const sections = [
  { title: "Team Management", description: "Manage members, ownership transfers, role assignments and access.", href: "/settings/team-members", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { title: "Roles & Permissions", description: "Create roles, manage permission matrix and access hierarchy.", href: "/settings/roles", icon: KeyRound, color: "text-purple-400", bg: "bg-purple-500/10" },
  { title: "Security Center", description: "MFA, IP allowlists, lockdown controls and security posture.", href: "/settings/security", icon: Shield, color: "text-green-400", bg: "bg-green-500/10" },
  { title: "Licensing Defaults", description: "Templates, grace periods, limits and activation policies.", href: "/settings/licensing", icon: SettingsIcon, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { title: "System Administration", description: "Platform health, backups, maintenance mode and environment.", href: "/settings/system", icon: Server, color: "text-zinc-400", bg: "bg-zinc-800" },
  { title: "Audit Configuration", description: "Retention policies, exports, alerts and compliance settings.", href: "/settings/audit", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
];

export default async function SettingsPage() {
  const [teamMembers, roles, securityPolicies, licenses] = await Promise.all([
    prisma.teamMember.findMany(),
    prisma.role.findMany(),
    prisma.securityPolicy.findMany(),
    prisma.license.findMany(),
  ]);

  const activePolicies = securityPolicies.filter((p) => p.enabled).length;
  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Enterprise Control Center"
        description="Centralized management for security, access control, licensing, compliance and platform administration."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Team Members" value={teamMembers.length} icon={Users} color="blue" subtitle={`${roles.length} roles`} />
        <StatCard title="Security Policies" value={`${activePolicies}/${securityPolicies.length}`} icon={Shield} color={activePolicies === securityPolicies.length ? "green" : "yellow"} subtitle="Active" />
        <StatCard title="Active Licenses" value={activeLicenses} icon={Activity} color="green" subtitle={`${licenses.length} total`} />
        <StatCard title="Platform Health" value="Healthy" icon={CheckCircle} color="green" />
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
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${section.bg} ${section.color}`}>
                <Icon size={24} />
              </div>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 text-sm text-zinc-500">{section.description}</p>
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
          <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/api/licenses/emergency-mode" className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-500">
            Emergency Lockdown
          </Link>
          <button className="rounded-xl bg-yellow-600 px-4 py-3 font-medium text-white transition-colors hover:bg-yellow-500">
            Revoke All Sessions
          </button>
          <button className="rounded-xl bg-zinc-700 px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-600">
            Export Audit Logs
          </button>
        </div>
        <p className="mt-4 text-sm text-zinc-500">Restricted to OWNER and SUPER_ADMIN roles.</p>
      </div>
    </div>
  );
}
