import { prisma } from "@/lib/prisma";
import MemberActions from "./team-members/MemberActions";
import RoleSelector from "./team-members/RoleSelector";

export default async function TeamMembersTable() {
  const members = await prisma.teamMember.findMany({
    include: {
      role: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const roles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Team Directory
          </h2>

          <p className="text-sm text-zinc-500">
            Manage members, roles and access.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 px-4 py-2">
          {members.length} Members
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="p-3 text-left">
                Member
              </th>

              <th className="p-3 text-left">
                Role
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3 text-left">
                Created
              </th>

              <th className="p-3 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-zinc-800"
              >
                <td className="p-4">
                  <div>
                    <div className="font-medium">
                      {member.name}
                    </div>

                    <div className="text-sm text-zinc-500">
                      {member.email}
                    </div>
                  </div>
                </td>

                <td className="p-4">
                  <RoleSelector
                    memberId={member.id}
                    currentRoleId={member.roleId}
                    roles={roles}
                  />
                </td>

                <td className="p-4">
                  {member.status === "ACTIVE" ? (
                    <span className="rounded-lg bg-green-500/10 px-3 py-1 text-green-400">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="rounded-lg bg-red-500/10 px-3 py-1 text-red-400">
                      SUSPENDED
                    </span>
                  )}
                </td>

                <td className="p-4 text-sm text-zinc-500">
                  {new Date(
                    member.createdAt
                  ).toLocaleDateString()}
                </td>

                <td className="p-4">
                  <MemberActions
                    memberId={member.id}
                    status={member.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
