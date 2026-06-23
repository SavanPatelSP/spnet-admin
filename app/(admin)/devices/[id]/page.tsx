import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { formatDateTime } from "@/lib/shared";
import { Shield, KeyRound, Flag, Clock } from "lucide-react";
import { DeviceFingerprintCard } from "@/components/devices/DeviceFingerprintCard";
import { DeviceGeoInfo } from "@/components/devices/DeviceGeoInfo";
import { DeviceTrustBadge } from "@/components/devices/DeviceTrustBadge";
import { DeviceStatusActions } from "@/components/devices/DeviceStatusActions";
import { DeviceSessionEnforcement } from "@/components/devices/DeviceSessionEnforcement";
import RevokeDeviceButton from "@/components/devices/RevokeDeviceButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Device Details" };

export default async function DeviceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("View Devices");
  const activation = await prisma.activation.findUnique({
    where: { id },
    include: { license: true, deviceFingerprint: true },
  });

  if (!activation) notFound();

  const statusLabel = activation.status === "ACTIVE" ? "Active"
    : activation.status === "INACTIVE" ? "Inactive"
    : activation.status === "SUSPENDED" ? "Suspended"
    : "Blacklisted";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Device Details"
        description={`Activation information for ${activation.deviceName || "Unknown Device"} (${activation.ipAddress || "No IP"})`}
        gradient={false}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <DeviceStatusActions
              activationId={activation.id}
              status={activation.status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLACKLISTED"}
            />
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

      <StatCardGrid columns={4}>
        <StatCard
          title="Status"
          value={statusLabel}
          icon={Shield}
          color={activation.status === "ACTIVE" ? "green" : activation.status === "SUSPENDED" ? "yellow" : "red"}
        />
        <StatCard title="License" value={activation.license.key} icon={KeyRound} color="blue" />
        <StatCard title="Country" value={activation.country || "-"} icon={Flag} color="purple" />
        <StatCard title="First Seen" value={formatDateTime(activation.createdAt)} icon={Clock} color="default" />
      </StatCardGrid>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DeviceFingerprintCard
          activationId={activation.id}
          initialFingerprint={activation.deviceFingerprint ? {
            id: activation.deviceFingerprint.id,
            fingerprint: activation.deviceFingerprint.fingerprint,
            firstSeenAt: activation.deviceFingerprint.firstSeenAt.toISOString(),
            lastSeenAt: activation.deviceFingerprint.lastSeenAt.toISOString(),
            activationCount: activation.deviceFingerprint.activationCount,
            licenseIds: activation.deviceFingerprint.licenseIds,
          } : undefined}
        />
        <DeviceGeoInfo
          country={activation.country ?? undefined}
          city={activation.city ?? undefined}
          isp={activation.isp ?? undefined}
          os={activation.os ?? undefined}
          browser={activation.browser ?? undefined}
          deviceType={activation.deviceType ?? undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DeviceSessionEnforcement licenseId={activation.license.id} />
        <DeviceTrustBadge trustScore={activation.trustScore} size="lg" activationId={activation.id} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Device ID</p>
              <p className="mt-0.5 font-mono text-sm">{activation.deviceId}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Device Name</p>
              <p className="mt-0.5">{activation.deviceName || "Unknown Device"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">IP Address</p>
              <p className="mt-0.5">{activation.ipAddress || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Operating System</p>
              <p className="mt-0.5">{activation.os || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">OS Version</p>
              <p className="mt-0.5">{activation.osVersion || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Browser</p>
              <p className="mt-0.5">{activation.browser || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Browser Version</p>
              <p className="mt-0.5">{activation.browserVersion || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Device Type</p>
              <p className="mt-0.5">{activation.deviceType || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">User Agent</p>
              <p className="mt-0.5 break-all font-mono text-xs text-zinc-400">{activation.userAgent || "-"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Security Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-500">Trust Score</p>
              <p className="mt-0.5">
                <DeviceTrustBadge trustScore={activation.trustScore} size="md" activationId={activation.id} />
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Status</p>
              <p className="mt-0.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  activation.status === "ACTIVE" ? "bg-green-500/10 text-green-400"
                  : activation.status === "SUSPENDED" ? "bg-yellow-500/10 text-yellow-400"
                  : activation.status === "INACTIVE" ? "bg-zinc-500/10 text-zinc-400"
                  : "bg-red-500/10 text-red-400"
                }`}>
                  {statusLabel}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Last Seen</p>
              <p className="mt-0.5">{activation.lastSeenAt ? formatDateTime(activation.lastSeenAt) : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Fingerprint Appearances</p>
              <p className="mt-0.5">{activation.deviceFingerprint ? activation.deviceFingerprint.activationCount : "-"}</p>
            </div>
            {activation.notes && (
              <div>
                <p className="text-sm text-zinc-500">Notes</p>
                <p className="mt-0.5 text-sm text-zinc-300">{activation.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
