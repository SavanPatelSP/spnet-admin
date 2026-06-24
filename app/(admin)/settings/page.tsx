import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import Link from "next/link";
import { Shield, Users, KeyRound, FileText, Server, Settings as SettingsIcon, Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { getAggregatedFingerprintStats } from "@/lib/security/fingerprint";
import { getChainStats } from "@/lib/audit-chain";
import DangerZone from "@/components/settings/DangerZone";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Settings" };

const sections = [
  { title: "Team Management", description: "Manage members, ownership transfers, role assignments and access.", href: "/settings/team-members", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { title: "Roles & Permissions", description: "Create roles, manage permission matrix and access hierarchy.", href: "/settings/roles", icon: KeyRound, color: "text-purple-400", bg: "bg-purple-500/10" },
  { title: "Security Center", description: "MFA, IP allowlists, lockdown controls, security alerts and event timeline.", href: "/settings/security", icon: Shield, color: "text-green-400", bg: "bg-green-500/10" },
  { title: "Licensing Defaults", description: "Templates, grace periods, limits and activation policies.", href: "/settings/licensing", icon: SettingsIcon, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { title: "System Administration", description: "Platform health, backups, maintenance mode and environment.", href: "/settings/system", icon: Server, color: "text-zinc-400", bg: "bg-zinc-800" },
  { title: "Audit Configuration", description: "Retention policies, exports, alerts and compliance settings.", href: "/settings/audit", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
];

export default async function SettingsPage() {
  await requirePermission("Access Settings");
  const [teamMembers, roles, securityPolicies, licenses, fingerprintStats, chainStats] = await Promise.all([
    prisma.teamMember.findMany(),
    prisma.role.findMany({ select: { id: true, name: true } }),
    prisma.securityPolicy.findMany(),
    prisma.license.findMany(),
    getAggregatedFingerprintStats(),
    getChainStats(),
  ]);

  const activePolicies = securityPolicies.filter((p) => p.enabled).length;
  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Enterprise Control Center"
        description="Centralized management for security, access control, licensing, compliance and platform administration."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Team Members" value={teamMembers.length} icon={Users} color="blue" subtitle={`${roles.length} roles`} />
        <StatCard title="Security Policies" value={`${activePolicies}/${securityPolicies.length}`} icon={Shield} color={activePolicies === securityPolicies.length ? "green" : "yellow"} subtitle="Active" />
        <StatCard title="Active Licenses" value={activeLicenses} icon={Activity} color="green" subtitle={`${licenses.length} total`} />
        <StatCard title="Suspicious Sessions" value={fingerprintStats.suspicious} icon={AlertTriangle} color={fingerprintStats.suspicious > 0 ? "yellow" : "green"} />
        <StatCard title="Audit Integrity" value={chainStats.integrity === "INTACT" ? "Intact" : "Compromised"} icon={CheckCircle} color={chainStats.integrity === "INTACT" ? "green" : "red"} subtitle={`${chainStats.verified}/${chainStats.total}`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
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

      <DangerZone />
    </div>
  );
}
