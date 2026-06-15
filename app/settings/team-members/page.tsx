import { prisma } from "@/lib/prisma";
import TeamMembersTable from "@/components/settings/TeamMembersTable";
import AddMemberForm from "@/components/settings/team-members/AddMemberForm";

export const dynamic = "force-dynamic";

export default async function TeamMembersPage() {
  const totalMembers =
    await prisma.teamMember.count();

  const activeMembers =
    await prisma.teamMember.count({
      where: {
        status: "ACTIVE",
      },
    });

  const suspendedMembers =
    await prisma.teamMember.count({
      where: {
        status: "SUSPENDED",
      },
    });

  const totalRoles =
    await prisma.role.count();

  const owner = await prisma.teamMember.findFirst({
    include: {
      role: true,
    },
    where: {
      role: {
        name: "OWNER",
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black">
              Team Management
            </h1>

            <p className="mt-3 max-w-3xl text-zinc-400">
              Enterprise identity,
              ownership, access control,
              governance and role
              administration for SP-NET.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-6 py-4">
            <p className="text-xs uppercase text-blue-400">
              Platform Status
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              Operational
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Team Members
          </p>

          <h2 className="mt-2 text-4xl font-black">
            {totalMembers}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Active Members
          </p>

          <h2 className="mt-2 text-4xl font-black text-green-400">
            {activeMembers}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Suspended Members
          </p>

          <h2 className="mt-2 text-4xl font-black text-red-400">
            {suspendedMembers}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Active Roles
          </p>

          <h2 className="mt-2 text-4xl font-black">
            {totalRoles}
          </h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              Invite Team Member
            </h2>

            <p className="mt-1 text-zinc-500">
              Create new administrators
              and assign platform roles.
            </p>
          </div>

          <AddMemberForm />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-bold">
            Ownership
          </h2>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Current Owner
            </p>

            <p className="mt-2 text-lg font-semibold">
              {owner?.name || "Unknown"}
            </p>

            <p className="text-sm text-zinc-500">
              {owner?.email || "-"}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-sm text-yellow-400">
              Ownership Protected
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Transfer requires
              explicit owner approval.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button className="rounded-xl bg-yellow-600 px-4 py-3 text-white">
              Transfer Ownership
            </button>

            <button className="rounded-xl bg-zinc-800 px-4 py-3">
              Export Access Report
            </button>
          </div>
        </div>
      </div>

      <TeamMembersTable />
    </div>
  );
}
