import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { formatDateTime } from "@/lib/shared";
import { Shield, KeyRound, Flag, Clock } from "lucide-react";
import { DeviceFingerprintCard } from "@/components/devices/DeviceFingerprintCard";
import { DeviceGeoInfo } from "@/components/devices/DeviceGeoInfo";
import { DeviceTrustBadge } from "@/components/devices/DeviceTrustBadge";
import { DeviceBlacklistButton } from "@/components/devices/DeviceBlacklistButton";
import { DeviceSessionEnforcement } from "@/components/devices/DeviceSessionEnforcement";
import RevokeDeviceButton from "@/components/devices/RevokeDeviceButton";

export const dynamic = "force-dynamic";

export default async function DeviceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activation = await prisma.activation.findUnique({
    where: { id },
    include: { license: true, fingerprint: true },
  });

  if (!activation) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Device Details"
        description={`Activation information for ${activation.deviceName || "Unknown Device"} (${activation.ipAddress || "No IP"})`}
        gradient={false}
        actions={
          <div className="flex items-center gap-3">
            <DeviceBlacklistButton
              activationId={activation.id}
              isBlacklisted={activation.isBlacklisted}
              onToggle={() => {}}
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
          value={activation.trustScore >= 60 ? "High Trust" : activation.trustScore >= 30 ? "Medium Trust" : "Low Trust"}
          icon={Shield}
          color={activation.trustScore >= 60 ? "green" : activation.trustScore >= 30 ? "yellow" : "red"}
        />
        <StatCard title="License" value={activation.license.key} icon={KeyRound} color="blue" />
        <StatCard title="Country" value={activation.country || "-"} icon={Flag} color="purple" />
        <StatCard title="First Seen" value={formatDateTime(activation.createdAt)} icon={Clock} color="default" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <DeviceFingerprintCard
          activationId={activation.id}
          initialFingerprint={activation.fingerprint ? {
            fingerprint: activation.fingerprint.fingerprint,
            confidenceScore: activation.fingerprint.confidenceScore,
            firstSeen: activation.fingerprint.firstSeen.toISOString(),
            lastSeen: activation.fingerprint.lastSeen.toISOString(),
          } : undefined}
        />
        <DeviceGeoInfo
          country={activation.country ?? undefined}
          city={activation.city ?? undefined}
          region={activation.region ?? undefined}
          isp={activation.isp ?? undefined}
          os={activation.os ?? undefined}
          browser={activation.browser ?? undefined}
          deviceType={activation.deviceType ?? undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DeviceSessionEnforcement licenseId={activation.license.id} />
        <DeviceTrustBadge trustScore={activation.trustScore} size="lg" activationId={activation.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
              <p className="text-sm text-zinc-500">Browser</p>
              <p className="mt-0.5">{activation.browser || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Device Type</p>
              <p className="mt-0.5">{activation.deviceType || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Manufacturer</p>
              <p className="mt-0.5">{activation.manufacturer || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Model</p>
              <p className="mt-0.5">{activation.model || "-"}</p>
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
              <p className="text-sm text-zinc-500">Blacklist Status</p>
              <p className="mt-0.5">
                {activation.isBlacklisted ? (
                  <span className="font-medium text-red-400">Blacklisted</span>
                ) : (
                  <span className="font-medium text-green-400">Not Blacklisted</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Last Seen</p>
              <p className="mt-0.5">{activation.lastSeen ? formatDateTime(activation.lastSeen) : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Fingerprint Confidence</p>
              <p className="mt-0.5">{activation.fingerprint ? `${activation.fingerprint.confidenceScore}%` : "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
