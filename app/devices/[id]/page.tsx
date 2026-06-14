import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DeviceDetailsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const activation =
    await prisma.activation.findUnique({
      where: {
        id,
      },
      include: {
        license: true,
      },
    });

  if (!activation) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">
          Device Not Found
        </h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          Device Details
        </h1>

        <p className="mt-2 text-zinc-500">
          Detailed activation and
          license information.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Device Information
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">
                Device Name
              </p>

              <p>
                {activation.deviceName ??
                  "Unknown Device"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Device ID
              </p>

              <p className="font-mono text-sm">
                {activation.deviceId}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                IP Address
              </p>

              <p>
                {activation.ipAddress ??
                  "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Activated
              </p>

              <p>
                {new Intl.DateTimeFormat(
                  "en-IN",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }
                ).format(
                  activation.createdAt
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">
            License Information
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">
                License Key
              </p>

              <p className="font-mono text-sm">
                {activation.license.key}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Organization
              </p>

              <p>
                {activation.license.organization}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Plan
              </p>

              <p>
                {activation.license.plan}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Status
              </p>

              <span
                className={
                  activation.license.status ===
                  "ACTIVE"
                    ? "rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400"
                    : "rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400"
                }
              >
                {activation.license.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Actions
        </h2>

        <div className="flex gap-3">
          <Link
            href={`/licenses/${activation.license.id}`}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white"
          >
            View License
          </Link>

          <Link
            href="/devices"
            className="rounded-xl bg-zinc-800 px-4 py-2"
          >
            Back to Devices
          </Link>
        </div>
      </div>
    </div>
  );
}
