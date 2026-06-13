const users = [
  {
    id: 1,
    username: "savan",
    role: "Admin",
    premium: true,
    status: "Active",
  },
  {
    id: 2,
    username: "john",
    role: "Moderator",
    premium: false,
    status: "Muted",
  },
  {
    id: 3,
    username: "alex",
    role: "User",
    premium: true,
    status: "Active",
  },
];

export default function UsersPage() {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-5xl font-black">
          User Management
        </h1>

        <p className="text-zinc-400 mt-2">
          Manage platform users
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">

        <table className="w-full">

          <thead className="bg-zinc-800/70">

            <tr>
              <th className="text-left p-4">User</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Premium</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>

          </thead>

          <tbody>

            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-zinc-800"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                      {user.username.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p>{user.username}</p>
                      <p className="text-xs text-zinc-500">
                        ID #{user.id}
                      </p>
                    </div>

                  </div>
                </td>

                <td className="p-4">
                  {user.role}
                </td>

                <td className="p-4">
                  {user.premium ? "⭐ Premium" : "-"}
                </td>

                <td className="p-4">
                  {user.status}
                </td>

                <td className="p-4">
                  <div className="flex gap-2">

                    <button className="px-3 py-1 rounded-lg bg-zinc-800">
                      View
                    </button>

                    <button className="px-3 py-1 rounded-lg bg-red-900">
                      Ban
                    </button>

                  </div>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
