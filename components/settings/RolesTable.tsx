import { prisma } from "@/lib/prisma";

export default async function RolesTable() {
  const roles = await prisma.role.findMany();

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Roles
        </h2>

        <button className="rounded-xl bg-blue-600 px-4 py-2 text-white">
          Create Role
        </button>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="rounded-xl border border-zinc-800 p-4"
          >
            {role.name}
          </div>
        ))}
      </div>
    </div>
  );
}
