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
          {
            key: "deviceName",
            label: "Device",
            sortable: true,
            searchable: true,
            render: (a: Record<string, unknown>) => (
              <Link href={`/devices/${a.id}`} className="font-medium text-blue-400 hover:underline">
                {(a.deviceName as string) || "Unknown Device"}
              </Link>
            ),
          },
          {
            key: "deviceId",
            label: "Device ID",
            sortable: true,
            searchable: true,
            render: (a: Record<string, unknown>) => <span className="font-mono text-xs text-zinc-400">{a.deviceId as string}</span>,
          },
          {
            key: "ipAddress",
            label: "IP Address",
            sortable: true,
            render: (a: Record<string, unknown>) => (a.ipAddress as string) || "-",
          },
          {
            key: "license",
            label: "License",
            sortable: true,
            searchable: true,
            render: (a: Record<string, unknown>) => {
              const lic = a.license as { id: string; key: string; status: string };
              return (
                <Link href={`/licenses/${lic.id}`} className="font-mono text-xs text-blue-400 hover:underline">
                  {lic.key}
                </Link>
              );
            },
          },
          {
            key: "organization",
            label: "Organization",
            sortable: true,
            searchable: true,
            render: (a: Record<string, unknown>) => {
              const lic = a.license as { organization: string };
              return lic.organization;
            },
          },
          {
            key: "createdAt",
            label: "Activated",
            sortable: true,
            render: (a: Record<string, unknown>) => formatDate(a.createdAt as Date),
          },
          {
            key: "actions",
            label: "Actions",
            className: "w-24",
            render: (a: Record<string, unknown>) => <RevokeDeviceButton id={a.id as string} />,
          },
        ]}
        data={activations as unknown as Record<string, unknown>[]}
        keyExtractor={(a) => a.id as string}
        searchPlaceholder="Search by device name, ID, or license..."
        emptyMessage="No activated devices found. Activate a license to see devices here."
      />
    </div>
  );
}
