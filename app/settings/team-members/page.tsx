import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import TeamMembersTable from "@/components/settings/TeamMembersTable";
import AddMemberForm from "@/components/settings/team-members/AddMemberForm";
import { Users, UserCheck, UserX, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamMembersPage() {
  const [totalMembers, activeMembers, totalRoles] = await Promise.all([
    prisma.teamMember.count(),
    prisma.teamMember.count({ where: { status: "ACTIVE" } }),
    prisma.role.count(),
  ]);

  const suspendedMembers = totalMembers - activeMembers;

  const owner = await prisma.teamMember.findFirst({
    include: { role: true },
    where: { role: { name: "OWNER" } },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team Management"
        description="Enterprise identity, ownership, access control, governance and role administration."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Team Members" value={totalMembers} icon={Users} color="blue" />
        <StatCard title="Active Members" value={activeMembers} icon={UserCheck} color="green" subtitle={`${totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}% active`} />
        <StatCard title="Suspended" value={suspendedMembers} icon={UserX} color={suspendedMembers > 0 ? "yellow" : "default"} />
        <StatCard title="Active Roles" value={totalRoles} icon={Shield} color="purple" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Invite Team Member</h2>
            <p className="mt-1 text-sm text-zinc-500">Create new administrators and assign platform roles.</p>
          </div>
          <AddMemberForm />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-bold">Ownership</h2>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Current Owner</p>
            <p className="mt-2 text-lg font-semibold">{owner?.name || "Unknown"}</p>
            <p className="text-sm text-zinc-500">{owner?.email || "-"}</p>
          </div>
          <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-sm text-yellow-400">Ownership Protected</p>
            <p className="mt-1 text-xs text-zinc-400">Transfer requires explicit owner approval.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button className="rounded-xl bg-yellow-600 px-4 py-3 font-medium text-white transition-colors hover:bg-yellow-500">
              Transfer Ownership
            </button>
            <button className="rounded-xl bg-zinc-800 px-4 py-3 font-medium text-zinc-200 transition-colors hover:bg-zinc-700">
              Export Access Report
            </button>
          </div>
        </div>
      </div>

      <TeamMembersTable />
    </div>
  );
}
