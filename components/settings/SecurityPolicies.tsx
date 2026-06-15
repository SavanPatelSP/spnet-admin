import { prisma } from "@/lib/prisma";
import PolicyActions from "./security/PolicyActions";

export default async function SecurityPolicies() {
  const policies =
    await prisma.securityPolicy.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });

  const enabled =
    policies.filter(
      (p) => p.enabled
    ).length;

  const critical =
    policies.filter(
      (p) => p.severity === "Critical"
    ).length;

  const systemManaged =
    policies.filter(
      (p) => p.systemManaged
    ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black">
              Security Policy Center
            </h2>

            <p className="mt-2 text-zinc-400">
              Authentication, network protection,
              monitoring, device security and
              incident response governance.
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-6 py-4">
            <p className="text-xs uppercase tracking-wider text-green-400">
              Security Coverage
            </p>

            <p className="mt-1 text-3xl font-black">
              {Math.round(
                (enabled /
                  Math.max(
                    policies.length,
                    1
                  )) *
                  100
              )}
              %
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Total Policies
          </p>

          <h3 className="mt-2 text-4xl font-black">
            {policies.length}
          </h3>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Enabled
          </p>

          <h3 className="mt-2 text-4xl font-black text-green-400">
            {enabled}
          </h3>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Critical
          </p>

          <h3 className="mt-2 text-4xl font-black text-red-400">
            {critical}
          </h3>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            System Managed
          </p>

          <h3 className="mt-2 text-4xl font-black text-blue-400">
            {systemManaged}
          </h3>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Policy Directory
            </h2>

            <p className="text-sm text-zinc-500">
              Real-time security enforcement
              configuration.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 px-4 py-2">
            {policies.length} Active Records
          </div>
        </div>

        <div className="space-y-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 transition hover:border-zinc-700"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold">
                      {policy.name}
                    </h3>

                    {policy.enabled ? (
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">
                        ENABLED
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400">
                        DISABLED
                      </span>
                    )}

                    {policy.systemManaged && (
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                        SYSTEM
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-zinc-500">
                    {policy.description ||
                      "Enterprise security policy."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-xl bg-zinc-800 px-3 py-1 text-sm">
                      {policy.category}
                    </span>

                    <span
                      className={`rounded-xl px-3 py-1 text-sm ${
                        policy.severity ===
                        "Critical"
                          ? "bg-red-500/10 text-red-400"
                          : policy.severity ===
                            "High"
                          ? "bg-orange-500/10 text-orange-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {policy.severity}
                    </span>
                  </div>
                </div>

                <div className="min-w-[180px]">
                  <PolicyActions
                    id={policy.id}
                    enabled={policy.enabled}
                  />
                </div>
              </div>

              <div className="mt-5 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
                Last Updated •{" "}
                {new Date(
                  policy.updatedAt
                ).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
