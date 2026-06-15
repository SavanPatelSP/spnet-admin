import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/shared";
import { Monitor, Globe, Fingerprint, KeyRound } from "lucide-react";
import RevokeDeviceButton from "@/components/devices/RevokeDeviceButton";

export const dynamic = "force-dynamic";

export default async function DeviceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activation = await prisma.activation.findUnique({
    where: { id },
    include: { license: { include: { activations: true } } },
  });

  if (!activation) notFound();

  const deviceCount = activation.license.activations.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Device Details"
        description={`Activation information for ${activation.deviceName || "Unknown Device"}`}
        gradient={false}
        actions={
          <div className="flex items-center gap-3">
            <RevokeDeviceButton id={activation.id} />
            <Link
              href={`/licenses/${activation.license.id}`}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              View License
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Device Name" value={activation.deviceName || "Unknown"} icon={Monitor} color="blue" />
        <StatCard title="Device ID" value={activation.deviceId} icon={Fingerprint} subtitle="Unique identifier" />
        <StatCard title="IP Address" value={activation.ipAddress || "-"} icon={Globe} color="purple" />
        <StatCard title="License" value={activation.license.key} icon={KeyRound} color="green" subtitle={activation.license.plan} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Device Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Device Name</p>
              <p className="mt-0.5">{activation.deviceName || "Unknown Device"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Device ID</p>
              <p className="mt-0.5 font-mono text-sm">{activation.deviceId}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">IP Address</p>
              <p className="mt-0.5">{activation.ipAddress || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Activated On</p>
              <p className="mt-0.5 text-sm">{formatDateTime(activation.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">License Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">License Key</p>
              <p className="mt-0.5 font-mono text-sm">
                <Link href={`/licenses/${activation.license.id}`} className="text-blue-400 hover:underline">
                  {activation.license.key}
                </Link>
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Organization</p>
              <p className="mt-0.5">{activation.license.organization}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Plan</p>
              <p className="mt-0.5">
                <span className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-0.5 text-sm">{activation.license.plan}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Status</p>
              <p className="mt-0.5"><StatusBadge status={activation.license.status} /></p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Active Devices</p>
              <p className="mt-0.5">{deviceCount}/{activation.license.maxDevices}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">License Expiry</p>
              <p className="mt-0.5 text-sm">{formatDateTime(activation.license.expiresAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
