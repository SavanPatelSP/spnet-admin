import { prisma } from "@/lib/prisma";

export default async function SettingsStats() {
  const [
    teamMembers,
    roles,
    policies,
    auditLogs,
  ] = await Promise.all([
    prisma.teamMember.count(),
    prisma.role.count(),
    prisma.securityPolicy.count(),
    prisma.auditLog.count(),
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-500">
          Team Members
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {teamMembers}
        </h2>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-500">
          Roles
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {roles}
        </h2>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-500">
          Security Policies
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {policies}
        </h2>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-500">
          Audit Logs
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          {auditLogs}
        </h2>
      </div>
    </div>
  );
}
