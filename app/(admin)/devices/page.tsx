import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Devices" };

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DevicesTable } from "@/components/devices/DevicesTable";
import { DeviceAnalyticsPanel } from "@/components/devices/DeviceAnalyticsPanel";
import { DevicesExportButton } from "@/components/devices/DevicesExportButton";
import { Monitor, Fingerprint, Globe, KeyRound, Ban, TrendingUp, Laptop, Flag } from "lucide-react";

export default async function DevicesPage() {
  const activations = await prisma.activation.findMany({
    include: { license: true },
    orderBy: { createdAt: "desc" },
  });

  const totalDevices = activations.length;
  const uniqueLicenses = new Set(activations.map((a) => a.licenseId)).size;
  const uniqueIPs = new Set(activations.map((a) => a.ipAddress).filter(Boolean)).size;
  const uniqueOrgs = new Set(activations.map((a) => a.license.organization)).size;
  const blacklisted = activations.filter((a) => a.isBlacklisted).length;
  const avgTrustScore = totalDevices > 0
    ? Math.round(activations.reduce((sum, a) => sum + a.trustScore, 0) / totalDevices)
    : 0;
  const osTypes = new Set(activations.map((a) => a.os).filter(Boolean)).size;
  const countries = new Set(activations.map((a) => a.country).filter(Boolean)).size;

  const devices = activations.map((a) => ({
    id: a.id,
    deviceName: a.deviceName,
    deviceId: a.deviceId,
    ipAddress: a.ipAddress,
    trustScore: a.trustScore,
    os: a.os,
    browser: a.browser,
    country: a.country,
    isBlacklisted: a.isBlacklisted,
    licenseId: a.license.id,
    licenseKey: a.license.key,
    organization: a.license.organization,
    lastSeen: a.lastSeen,
    createdAt: a.createdAt,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Device Management"
        description="Monitor and manage all activated devices across your licensing platform."
        actions={<DevicesExportButton />}
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Devices" value={totalDevices} icon={Monitor} color="blue" />
        <StatCard title="Licensed Products" value={uniqueLicenses} icon={KeyRound} color="green" />
        <StatCard title="Unique IPs" value={uniqueIPs} icon={Globe} color="purple" />
        <StatCard title="Organizations" value={uniqueOrgs} icon={Fingerprint} color="yellow" />
        <StatCard title="Blacklisted" value={blacklisted} icon={Ban} color="red" />
        <StatCard title="Avg Trust Score" value={`${avgTrustScore}%`} icon={TrendingUp} color={avgTrustScore >= 60 ? "green" : avgTrustScore >= 30 ? "yellow" : "red"} />
        <StatCard title="OS Types" value={osTypes} icon={Laptop} color="blue" />
        <StatCard title="Countries" value={countries} icon={Flag} color="purple" />
      </StatCardGrid>

      <DeviceAnalyticsPanel />

      <DevicesTable devices={devices} />
    </div>
  );
}
