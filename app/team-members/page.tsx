const members = [
  {
    name: "Savan Patel",
    role: "OWNER",
    revalidation: "7 Days",
  },
  {
    name: "Developer Team",
    role: "DEVELOPER",
    revalidation: "7 Days",
  },
  {
    name: "Billing Team",
    role: "BILLING_MANAGER",
    revalidation: "7 Days",
  },
];

export default function TeamMembersPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Team Members
        </h1>

        <p className="text-zinc-500 mt-2">
          Manage users, roles and license policies.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">

        <table className="w-full">

          <thead className="border-b border-zinc-800">
            <tr>
              <th className="text-left p-4">
                Name
              </th>

              <th className="text-left p-4">
                Role
              </th>

              <th className="text-left p-4">
                Revalidate
              </th>
            </tr>
          </thead>

          <tbody>

            {members.map((member) => (
              <tr
                key={member.name}
                className="border-b border-zinc-800"
              >
                <td className="p-4">
                  {member.name}
                </td>

                <td className="p-4">
                  {member.role}
                </td>

                <td className="p-4">
                  {member.revalidation}
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
