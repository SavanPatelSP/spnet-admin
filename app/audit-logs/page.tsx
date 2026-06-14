import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalLogs = logs.length;

  const todayLogs = logs.filter((log) => {
    const today = new Date();

    return (
      new Date(log.createdAt)
        .toDateString() ===
      today.toDateString()
    );
  }).length;

  const uniqueUsers = new Set(
    logs
      .map((log) => log.actorName)
      .filter(Boolean)
  ).size;

  const uniqueOrganizations =
    new Set(
      logs
        .map(
          (log) =>
            log.organization
        )
        .filter(Boolean)
    ).size;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Audit Logs
        </h1>

        <p className="mt-2 text-zinc-500">
          Enterprise activity
          tracking and security
          auditing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Total Events
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalLogs}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Today's Events
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {todayLogs}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Team Members
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {uniqueUsers}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Organizations
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {uniqueOrganizations}
          </h2>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 p-5">
          <h2 className="text-xl font-semibold">
            Activity Timeline
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/50">
              <tr>
                <th className="p-4 text-left">
                  Time
                </th>

                <th className="p-4 text-left">
                  Action
                </th>

                <th className="p-4 text-left">
                  Organization
                </th>

                <th className="p-4 text-left">
                  Role
                </th>

                <th className="p-4 text-left">
                  User
                </th>

                <th className="p-4 text-left">
                  Description
                </th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/30"
                >
                  <td className="p-4 whitespace-nowrap">
                    {new Intl.DateTimeFormat(
                      "en-IN",
                      {
                        dateStyle:
                          "medium",
                        timeStyle:
                          "short",
                      }
                    ).format(
                      new Date(
                        log.createdAt
                      )
                    )}
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                      {log.action}
                    </span>
                  </td>

                  <td className="p-4">
                    {log.organization ??
                      "-"}
                  </td>

                  <td className="p-4">
                    {log.actorRole ? (
                      <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
                        {
                          log.actorRole
                        }
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="p-4">
                    {log.actorName ??
                      "-"}
                  </td>

                  <td className="p-4 max-w-md">
                    {log.description ??
                      "-"}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-zinc-500"
                  >
                    No audit logs
                    available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
