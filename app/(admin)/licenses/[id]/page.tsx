import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime, daysUntil } from "@/lib/shared";
import { DEFAULT_LOCALE, EXPIRING_SOON_DAYS } from "@/lib/constants";
import DeleteLicenseButton from "@/components/licenses/DeleteLicenseButton";
import EditLicenseButton from "@/components/licenses/EditLicenseButton";
import ToggleLicenseStatusButton from "@/components/licenses/ToggleLicenseStatusButton";
import RegenerateLicenseButton from "@/components/licenses/RegenerateLicenseButton";
import { KeyRound, CalendarDays, Monitor, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LicenseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const license = await prisma.license.findUnique({
    where: { id },
    include: { activations: { orderBy: { createdAt: "desc" } } },
  });

  if (!license) notFound();

  const days = daysUntil(license.expiresAt);
  const devicesUsed = license.activations.length;
  const utilization = license.maxDevices > 0 ? Math.round((devicesUsed / license.maxDevices) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="License Details"
        description={`Manage and monitor license ${license.key}`}
        gradient={false}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <EditLicenseButton license={license} size="md" />
            <ToggleLicenseStatusButton id={license.id} status={license.status} size="md" />
            <RegenerateLicenseButton id={license.id} size="md" />
            <DeleteLicenseButton id={license.id} size="md" />
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="License Key" value={license.key} icon={KeyRound} subtitle={license.plan} />
        <StatCard title="Organization" value={license.organization} subtitle={`Created ${formatDate(license.createdAt)}`} />
        <StatCard
          title="Expiry"
          value={formatDate(license.expiresAt)}
          icon={CalendarDays}
          color={days < 0 ? "red" : days <= EXPIRING_SOON_DAYS ? "yellow" : "default"}
          subtitle={days < 0 ? "Expired" : `${days} days remaining`}
        />
        <StatCard title="Devices" value={`${devicesUsed}/${license.maxDevices}`} icon={Monitor} subtitle={`${utilization}% utilized`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold">License Information</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500">License Key</p>
                  <p className="mt-0.5 font-mono text-sm">{license.key}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Organization</p>
                  <p className="mt-0.5">{license.organization}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Plan</p>
                  <p className="mt-0.5">
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm">{license.plan}</span>
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-500">Status</p>
                  <p className="mt-0.5"><StatusBadge status={license.status} /></p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Max Devices</p>
                  <p className="mt-0.5">{license.maxDevices}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Created</p>
                  <p className="mt-0.5 text-sm">{formatDateTime(license.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Last Updated</p>
                  <p className="mt-0.5 text-sm">{formatDateTime(license.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Notes</h2>
          {license.notes ? (
            <p className="whitespace-pre-wrap text-sm text-zinc-300">{license.notes}</p>
          ) : (
            <p className="text-sm text-zinc-500">No notes available.</p>
          )}

          <h3 className="mb-3 mt-6 font-semibold">Danger Zone</h3>
          <div className="space-y-2">
            <DeleteLicenseButton id={license.id} size="md" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Activated Devices ({devicesUsed})</h2>
        </div>
        {license.activations.length === 0 ? (
          <p className="text-sm text-zinc-500">No devices activated for this license.</p>
        ) : (
          <div className="space-y-3">
            {license.activations.map((device) => (
              <Link
                key={device.id}
                href={`/devices/${device.id}`}
                className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3 transition-colors hover:bg-zinc-800"
              >
                <div>
                  <p className="font-medium">{device.deviceName || "Unknown Device"}</p>
                  <p className="font-mono text-xs text-zinc-500">{device.deviceId}</p>
                </div>
                <div className="text-right text-sm text-zinc-500">
                  <p>{device.ipAddress || "-"}</p>
                  <p className="text-xs">{formatDate(device.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
