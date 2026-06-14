export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import CreateLicenseModal from "@/components/licenses/CreateLicenseModal";
import DeleteLicenseButton from "@/components/licenses/DeleteLicenseButton";
import EditLicenseButton from "@/components/licenses/EditLicenseButton";

export default async function LicensesPage() {
  const licenses = await prisma.license.findMany({
    include: {
      activations: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const activeLicenses = licenses.filter(
    (license) => license.status === "ACTIVE"
  ).length;

  const suspendedLicenses = licenses.filter(
    (license) => license.status === "SUSPENDED"
  ).length;

  const totalDevices = licenses.reduce(
    (total, license) =>
      total + license.activations.length,
    0
  );

  const totalCapacity = licenses.reduce(
    (total, license) =>
      total + license.maxDevices,
    0
  );

  const utilization =
    totalCapacity === 0
      ? 0
      : Math.round(
          (totalDevices / totalCapacity) * 100
        );

  const expiringSoon = licenses.filter((license) => {
    const expiry = new Date(
      Number(license.expiresAt)
    );

    const days =
      (expiry.getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);

    return days >= 0 && days <= 30;
  }).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            License Management
          </h1>

          <p className="mt-2 text-zinc-500">
            Enterprise license operations,
            monitoring and lifecycle
            management.
          </p>
        </div>

        <CreateLicenseModal />
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Total Licenses
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {licenses.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Active
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-400">
            {activeLicenses}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Suspended
          </p>

          <h2 className="mt-2 text-3xl font-bold text-yellow-400">
            {suspendedLicenses}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Expiring Soon
          </p>

          <h2 className="mt-2 text-3xl font-bold text-red-400">
            {expiringSoon}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Active Devices
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalDevices}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Utilization
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {utilization}%
          </h2>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-950/40">
            <tr>
              <th className="p-4 text-left">
                License Key
              </th>

              <th className="p-4 text-left">
                Organization
              </th>

              <th className="p-4 text-left">
                Plan & Health
              </th>

              <th className="p-4 text-left">
                Devices
              </th>

              <th className="p-4 text-left">
                Expiry
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {licenses.map((license) => (
              <tr
                key={license.id}
                className="border-b border-zinc-800 hover:bg-zinc-800/30"
              >
                <td className="p-4 font-mono text-sm">
                  <a
                    href={`/licenses/${license.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    {license.key}
                  </a>
                </td>

                <td className="p-4">
                  {license.organization}
                </td>

                <td className="p-4">
                  <div>
                    <div>{license.plan}</div>

                    <div className="mt-1">
                      {license.status ===
                      "ACTIVE" ? (
                        <span className="text-xs text-green-400">
                          Healthy
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400">
                          Attention Needed
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="p-4">
                  {license.activations.length}/
                  {license.maxDevices}
                </td>

                <td className="p-4">
                  {new Intl.DateTimeFormat(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  ).format(
                    new Date(
                      Number(
                        license.expiresAt
                      )
                    )
                  )}
                </td>

                <td className="p-4">
                  <span
                    className={
                      license.status ===
                      "ACTIVE"
                        ? "rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400"
                        : license.status ===
                          "SUSPENDED"
                        ? "rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400"
                        : "rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400"
                    }
                  >
                    {license.status}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex gap-2">
                    <EditLicenseButton
                      license={license}
                    />

                    <DeleteLicenseButton
                      id={license.id}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {licenses.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-zinc-500"
                >
                  No licenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
