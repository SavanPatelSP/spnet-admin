export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

import RevokeDeviceButton from "@/components/devices/RevokeDeviceButton";

export default async function DevicesPage() {
  const activations =
    await prisma.activation.findMany({
      include: {
        license: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  const totalDevices =
    activations.length;

  const uniqueLicenses =
    new Set(
      activations.map(
        (a) => a.licenseId
      )
    ).size;

  const uniqueIPs =
    new Set(
      activations
        .map((a) => a.ipAddress)
        .filter(Boolean)
    ).size;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Device Management
        </h1>

        <p className="mt-2 text-zinc-500">
          Monitor and manage all
          activated devices across
          your licensing platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Total Devices
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {totalDevices}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Licensed Products
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-400">
            {uniqueLicenses}
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">
            Unique IPs
          </p>

          <h2 className="mt-2 text-3xl font-bold text-blue-400">
            {uniqueIPs}
          </h2>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="border-b border-zinc-800 p-5">
          <h2 className="text-xl font-semibold">
            Activated Devices
          </h2>
        </div>

        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-950/40">
            <tr>
              <th className="p-4 text-left">
                Device
              </th>

              <th className="p-4 text-left">
                Device ID
              </th>

              <th className="p-4 text-left">
                IP Address
              </th>

              <th className="p-4 text-left">
                License
              </th>

              <th className="p-4 text-left">
                Organization
              </th>

              <th className="p-4 text-left">
                Activated
              </th>

<th className="p-4 text-left">
  Actions
</th>
            </tr>
          </thead>

          <tbody>
            {activations.map(
              (activation) => (
                <tr
                  key={activation.id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/30"
                >
                  <td className="p-4">
<a
  href={`/devices/${activation.id}`}
  className="text-blue-400 hover:underline"
>
  {activation.deviceName ||
    "Unknown Device"}
</a>
                  </td>

                  <td className="p-4 font-mono text-xs">
                    {
                      activation.deviceId
                    }
                  </td>

                  <td className="p-4">
                    {activation.ipAddress ||
                      "-"}
                  </td>

                  <td className="p-4 font-mono text-xs">
                    <a
                      href={`/licenses/${activation.license.id}`}
                      className="text-blue-400 hover:underline"
                    >
                      {
                        activation
                          .license.key
                      }
                    </a>
                  </td>

                  <td className="p-4">
                    {
                      activation
                        .license
                        .organization
                    }
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
                      activation.createdAt
                    )}
                  </td>
     
<td className="p-4">
  <RevokeDeviceButton
    id={activation.id}
  />
</td>
      </tr>
              )
            )}

            {activations.length ===
              0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-zinc-500"
                >
                  No activated
                  devices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
