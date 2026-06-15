import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ActivationsPage() {
  const activations =
    await prisma.activation.findMany({
      include: {
        license: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-black via-zinc-900 to-zinc-950 p-8">
        <h1 className="text-5xl font-black">
          Device Activations
        </h1>

        <p className="mt-3 text-zinc-400">
          Monitor active devices,
          licenses and activation history.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-zinc-800">
            <tr>
              <th className="p-4 text-left">
                Device
              </th>

              <th className="p-4 text-left">
                Device ID
              </th>

              <th className="p-4 text-left">
                License
              </th>

              <th className="p-4 text-left">
                IP Address
              </th>

              <th className="p-4 text-left">
                Activated
              </th>
            </tr>
          </thead>

          <tbody>
            {activations.map(
              (activation) => (
                <tr
                  key={activation.id}
                  className="border-b border-zinc-800"
                >
                  <td className="p-4">
                    {activation.deviceName ||
                      "Unknown Device"}
                  </td>

                  <td className="p-4 font-mono text-sm">
                    {activation.deviceId}
                  </td>

                  <td className="p-4">
                    {
                      activation.license
                        .organization
                    }
                  </td>

                  <td className="p-4">
                    {activation.ipAddress ||
                      "-"}
                  </td>

                  <td className="p-4">
                    {new Date(
                      activation.createdAt
                    ).toLocaleDateString()}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
