export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Monitor, Fingerprint, Globe, KeyRound } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/shared";
import RevokeDeviceButton from "@/components/devices/RevokeDeviceButton";
import Link from "next/link";

export default async function DevicesPage() {
  const activations = await prisma.activation.findMany({
    include: { license: true },
    orderBy: { createdAt: "desc" },
  });

  const totalDevices = activations.length;
  const uniqueLicenses = new Set(activations.map((a) => a.licenseId)).size;
  const uniqueIPs = new Set(activations.map((a) => a.ipAddress).filter(Boolean)).size;
  const uniqueOrgs = new Set(activations.map((a) => a.license.organization)).size;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Device Management"
        description="Monitor and manage all activated devices across your licensing platform."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Devices" value={totalDevices} icon={Monitor} color="blue" />
        <StatCard title="Licensed Products" value={uniqueLicenses} icon={KeyRound} color="green" />
        <StatCard title="Unique IPs" value={uniqueIPs} icon={Globe} color="purple" />
        <StatCard title="Organizations" value={uniqueOrgs} icon={Fingerprint} color="yellow" />
      </StatCardGrid>

      <DataTable
        columns={[
          { key: "deviceName", label: "Device", sortable: true, searchable: true },
          { key: "deviceId", label: "Device ID", sortable: true, searchable: true },
          { key: "ipAddress", label: "IP Address", sortable: true },
          { key: "license", label: "License", sortable: true, searchable: true },
          { key: "organization", label: "Organization", sortable: true, searchable: true },
          { key: "createdAt", label: "Activated", sortable: true },
          { key: "actions", label: "Actions", className: "w-24" },
        ]}
        rows={activations.map((a) => ({
          id: a.id,
          values: {
            deviceName: a.deviceName || "Unknown Device",
            deviceId: a.deviceId,
            ipAddress: a.ipAddress || "",
            license: a.license.key,
            organization: a.license.organization,
            createdAt: a.createdAt.toISOString(),
            actions: "",
          },
          cells: [
            <Link href={`/devices/${a.id}`} className="font-medium text-blue-400 hover:underline">
              {a.deviceName || "Unknown Device"}
            </Link>,
            <span className="font-mono text-xs text-zinc-400">{a.deviceId}</span>,
            <>{a.ipAddress || "-"}</>,
            <Link href={`/licenses/${a.license.id}`} className="font-mono text-xs text-blue-400 hover:underline">
              {a.license.key}
            </Link>,
            <>{a.license.organization}</>,
            <>{formatDate(a.createdAt)}</>,
            <RevokeDeviceButton id={a.id} />,
          ],
        }))}
        searchPlaceholder="Search by device name, ID, or license..."
        emptyMessage="No activated devices found. Activate a license to see devices here."
      />
    </div>
  );
}
