const logs = [
  {
    action: "Created License",
    user: "Savan Patel",
    time: "2 minutes ago",
  },
  {
    action: "Updated Security Policy",
    user: "Savan Patel",
    time: "15 minutes ago",
  },
  {
    action: "Created Team Member",
    user: "Savan Patel",
    time: "1 hour ago",
  },
  {
    action: "License Revalidated",
    user: "Developer Team",
    time: "3 hours ago",
  },
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Audit Logs
        </h1>

        <p className="text-zinc-500 mt-2">
          Monitor all security-sensitive actions across the platform.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">

        <table className="w-full">

          <thead className="border-b border-zinc-800">
            <tr>
              <th className="text-left p-4">Action</th>
              <th className="text-left p-4">User</th>
              <th className="text-left p-4">Time</th>
            </tr>
          </thead>

          <tbody>

            {logs.map((log, index) => (
              <tr
                key={index}
                className="border-b border-zinc-800"
              >
                <td className="p-4">
                  {log.action}
                </td>

                <td className="p-4">
                  {log.user}
                </td>

                <td className="p-4 text-zinc-500">
                  {log.time}
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
