import { prisma } from "@/lib/prisma";
import DeleteLicenseButton from "@/components/licenses/DeleteLicenseButton";
import EditLicenseButton from "@/components/licenses/EditLicenseButton";
import ToggleLicenseStatusButton from "@/components/licenses/ToggleLicenseStatusButton";
import RegenerateLicenseButton from "@/components/licenses/RegenerateLicenseButton";
import { notFound } from "next/navigation";

export default async function LicenseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const license = await prisma.license.findUnique({
    where: {
      id,
    },
    include: {
      activations: true,
    },
  });

  if (!license) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          License Details
        </h1>

        <p className="mt-2 text-zinc-500">
          Manage and monitor this license.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">
            License Information
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-zinc-500">
                License Key
              </p>

              <p className="font-mono">
                {license.key}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Organization
              </p>

              <p>{license.organization}</p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Plan
              </p>

              <p>{license.plan}</p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Status
              </p>

              <p>{license.status}</p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Devices
              </p>

              <p>
                {license.activations.length}/
                {license.maxDevices}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Expiry Date
              </p>

              <p>
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
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">
            Actions
          </h2>

          <div className="flex flex-wrap gap-3">
            <EditLicenseButton
              license={license}
            />

            <ToggleLicenseStatusButton
              id={license.id}
              status={license.status}
            />

           <RegenerateLicenseButton
             id={license.id}
           />

            <DeleteLicenseButton
              id={license.id}
            />
          </div>

          <div className="mt-6">
            <h3 className="mb-2 font-semibold">
              Notes
            </h3>

            <div className="rounded-xl bg-zinc-800 p-4">
              {license.notes ||
                "No notes available."}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">
          Activated Devices
        </h2>

        {license.activations.length === 0 ? (
          <p className="text-zinc-500">
            No active devices.
          </p>
        ) : (
          <div className="space-y-3">
            {license.activations.map(
              (device) => (
                <div
                  key={device.id}
                  className="rounded-xl bg-zinc-800 p-4"
                >
                  <p>
                    {device.deviceName ||
                      "Unknown Device"}
                  </p>

                  <p className="text-sm text-zinc-500">
                    {device.deviceId}
                  </p>

                  <p className="text-sm text-zinc-500">
                    {device.ipAddress ||
                      "No IP"}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
