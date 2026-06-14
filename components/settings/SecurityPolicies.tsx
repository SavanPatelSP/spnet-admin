import { prisma } from "@/lib/prisma";

export default async function SecurityPolicies() {
  const policies =
    await prisma.securityPolicy.findMany();

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">
        Security Policies
      </h2>

      <div className="space-y-3">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 p-4"
          >
            <span>{policy.name}</span>

            <span
              className={
                policy.enabled
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {policy.enabled
                ? "Enabled"
                : "Disabled"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
