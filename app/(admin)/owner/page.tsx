import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Owner Panel" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Shield, Users, KeyRound, AlertTriangle } from "lucide-react";

export default async function OwnerPage() {
  await requirePermission("Edit System Settings");
  const [owner, roles, teamMembers, licenses] = await Promise.all([
    prisma.teamMember.findFirst({
      include: { role: { select: { name: true } } },
      where: { role: { name: "OWNER" } },
    }),
    prisma.role.findMany({ select: { id: true, name: true, protected: true, members: { select: { id: true } } } }),
    prisma.teamMember.findMany(),
    prisma.license.findMany(),
  ]);

  const totalMembers = teamMembers.length;
  const totalLicenses = licenses.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Owner Control Center"
        description="Owner-level platform administration and governance."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Current Owner" value={owner?.name || "Not Set"} icon={Shield} color="purple" subtitle={owner?.email || ""} />
        <StatCard title="Team Members" value={totalMembers} icon={Users} color="blue" subtitle={`${teamMembers.filter((m) => m.status === "ACTIVE").length} active`} />
        <StatCard title="Roles" value={roles.length} icon={KeyRound} color="green" subtitle={`${roles.filter((r) => r.protected).length} protected`} />
        <StatCard title="Total Licenses" value={totalLicenses} icon={AlertTriangle} color="yellow" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Role Overview</h2>
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{role.name}</span>
                  {role.protected && <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">Protected</span>}
                </div>
                <span className="text-sm text-zinc-400">{role.members.length} members</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Ownership Details</h2>
          {owner ? (
            <div className="space-y-4">
              <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <span className="text-zinc-400">Name</span>
                <span className="font-medium">{owner.name}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <span className="text-zinc-400">Email</span>
                <span className="font-medium">{owner.email}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <span className="text-zinc-400">Role</span>
                <span className="font-medium">{owner.role.name}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                <span className="text-zinc-400">Since</span>
                <span className="font-medium">{new Date(owner.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No owner assigned.</p>
          )}
        </div>
      </div>
    </div>
  );
}
