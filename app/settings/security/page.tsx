import { prisma } from "@/lib/prisma";
import PolicyActions from "@/components/settings/security/PolicyActions";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const policies =
    await prisma.securityPolicy.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });

  const enabledPolicies =
    policies.filter((p) => p.enabled).length;

  const criticalPolicies =
    policies.filter(
      (p) => p.severity === "Critical"
    ).length;

  const systemManagedPolicies =
    policies.filter(
      (p) => p.systemManaged
    ).length;

  const authenticationPolicies =
    policies.filter(
      (p) =>
        p.category ===
        "Authentication"
    );

  const networkPolicies =
    policies.filter(
      (p) =>
        p.category === "Network"
    );

  const devicePolicies =
    policies.filter(
      (p) =>
        p.category ===
        "Device Security"
    );

  const securityScore = Math.round(
    (enabledPolicies /
      Math.max(
        policies.length,
        1
      )) *
      100
  );

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-black via-zinc-900 to-zinc-950 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black">
              Security Center
            </h1>

            <p className="mt-3 max-w-3xl text-zinc-400">
              Enterprise-grade security,
              authentication governance,
              threat protection and
              incident response.
            </p>
          </div>

          <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-6">
            <p className="text-xs uppercase tracking-wider text-green-400">
              Security Score
            </p>

            <h2 className="mt-2 text-5xl font-black">
              {securityScore}%
            </h2>

            <p className="text-sm text-zinc-400">
              Platform Protected
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Policies
          </p>

          <h2 className="mt-2 text-4xl font-black">
            {policies.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Enabled
          </p>

          <h2 className="mt-2 text-4xl font-black text-green-400">
            {enabledPolicies}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            Critical
          </p>

          <h2 className="mt-2 text-4xl font-black text-red-400">
            {criticalPolicies}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-zinc-500">
            System Managed
          </p>

          <h2 className="mt-2 text-4xl font-black text-blue-400">
            {systemManagedPolicies}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-bold">
            Authentication Health
          </h2>

          <p className="mt-4 text-4xl font-black text-green-400">
            {
              authenticationPolicies.filter(
                (p) => p.enabled
              ).length
            }
            /
            {
              authenticationPolicies.length
            }
          </p>

          <p className="mt-2 text-zinc-500">
            Authentication policies enabled
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-bold">
            Network Security
          </h2>

          <p className="mt-4 text-4xl font-black text-blue-400">
            {
              networkPolicies.filter(
                (p) => p.enabled
              ).length
            }
            /
            {networkPolicies.length}
          </p>

          <p className="mt-2 text-zinc-500">
            Network protections active
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-bold">
            Device Protection
          </h2>

          <p className="mt-4 text-4xl font-black text-yellow-400">
            {
              devicePolicies.filter(
                (p) => p.enabled
              ).length
            }
            /
            {devicePolicies.length}
          </p>

          <p className="mt-2 text-zinc-500">
            Device controls active
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-red-900 bg-red-950/20 p-6">
        <h2 className="mb-5 text-xl font-bold text-red-400">
          Incident Response
        </h2>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-red-600 px-5 py-3 text-white">
            Emergency Lockdown
          </button>

          <button className="rounded-xl bg-yellow-600 px-5 py-3 text-white">
            Force Reauthentication
          </button>

          <button className="rounded-xl bg-zinc-800 px-5 py-3">
            Export Security Report
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Security Policy Directory
          </h2>

          <div className="rounded-xl border border-zinc-800 px-4 py-2">
            {policies.length} Policies
          </div>
        </div>

        <div className="space-y-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="rounded-2xl border border-zinc-800 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {policy.name}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {policy.description ||
                      "Security policy configuration"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-zinc-800 px-3 py-1 text-sm">
                      {policy.category}
                    </span>

                    <span className="rounded-lg bg-yellow-500/10 px-3 py-1 text-sm text-yellow-400">
                      {policy.severity}
                    </span>

                    {policy.systemManaged && (
                      <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                        System Managed
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  {policy.enabled ? (
                    <span className="rounded-full bg-green-500/10 px-4 py-2 text-green-400">
                      Enabled
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-500/10 px-4 py-2 text-red-400">
                      Disabled
                    </span>
                  )}

                  <PolicyActions
                    id={policy.id}
                    enabled={policy.enabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
