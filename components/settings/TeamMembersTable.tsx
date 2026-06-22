import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/shared";
import { getAuthSession } from "@/lib/auth-helpers";
import MemberActions from "./team-members/MemberActions";
import RoleSelector from "./team-members/RoleSelector";

export default async function TeamMembersTable() {
  const session = await getAuthSession();
  const currentUserRole = session?.user?.role;

  const [members, roles] = await Promise.all([
    prisma.teamMember.findMany({ include: { role: true }, orderBy: { createdAt: "desc" } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Directory</h2>
          <p className="text-sm text-zinc-500">Manage members, roles and access.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-400">{members.length} Members</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="p-3 text-left text-sm font-medium text-zinc-400">Member</th>
              <th className="p-3 text-left text-sm font-medium text-zinc-400">Role</th>
              <th className="p-3 text-left text-sm font-medium text-zinc-400">Status</th>
              <th className="p-3 text-left text-sm font-medium text-zinc-400">Created</th>
              <th className="p-3 text-left text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/20">
                <td className="p-4">
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-zinc-500">{member.email}</div>
                  </div>
                </td>
                <td className="p-4">
                  <RoleSelector memberId={member.id} currentRoleId={member.roleId} roles={roles} />
                </td>
                <td className="p-4">
                  <StatusBadge status={member.status} />
                </td>
                <td className="p-4 text-sm text-zinc-500">{formatDate(member.createdAt)}</td>
                <td className="p-4">
                  <MemberActions memberId={member.id} memberName={member.name} memberEmail={member.email} memberRole={member.role.name} status={member.status} currentUserRole={currentUserRole} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
