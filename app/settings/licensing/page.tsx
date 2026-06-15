import { prisma } from "@/lib/prisma";
import LicensingAdminActions from "@/components/licenses/LicensingAdminActions";

export const dynamic = "force-dynamic";

export default async function LicensingSettingsPage() {
  const licenses =
    await prisma.license.findMany({
      include: {
        activations: true,
      },
    });

  const active =
    licenses.filter(
      (l) => l.status === "ACTIVE"
    ).length;

  const suspended =
    licenses.filter(
      (l) => l.status === "SUSPENDED"
    ).length;

  const expired =
    licenses.filter(
      (l) => l.status === "EXPIRED"
    ).length;

  const devices =
    licenses.reduce(
      (sum, l) =>
        sum + l.activations.length,
      0
    );

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-black via-zinc-900 to-zinc-950 p-8">
        <h1 className="text-5xl font-black">
          Licensing Control Center
        </h1>

        <p className="mt-3 text-zinc-400">
          Enterprise licensing,
          compliance, device limits,
          expiry tracking and
          emergency controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p>Total Licenses</p>
          <h2 className="mt-2 text-4xl font-black">
            {licenses.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p>Active</p>
          <h2 className="mt-2 text-4xl font-black text-green-400">
            {active}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p>Suspended</p>
          <h2 className="mt-2 text-4xl font-black text-yellow-400">
            {suspended}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p>Expired</p>
          <h2 className="mt-2 text-4xl font-black text-red-400">
            {expired}
          </h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-5 text-2xl font-bold">
            Platform Licensing Health
          </h2>

          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-800 p-4">
              Active Devices: {devices}
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              License Enforcement Enabled
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              Duplicate Device Detection
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              Expiry Monitoring Active
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-5 text-2xl font-bold">
            Administrative Controls
          </h2>

          <LicensingAdminActions />
        </div>
      </div>
    </div>
  );
}
