import { prisma } from "@/lib/prisma";

export default async function TeamMembersTable() {
  const members = await prisma.teamMember.findMany({
    include: {
      role: true,
    },
  });

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Team Members
        </h2>

        <button className="rounded-xl bg-blue-600 px-4 py-2 text-white">
          Add Member
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              className="border-b border-zinc-800"
            >
              <td className="p-3">{member.name}</td>
              <td className="p-3">{member.email}</td>
              <td className="p-3">{member.role.name}</td>
              <td className="p-3">{member.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
