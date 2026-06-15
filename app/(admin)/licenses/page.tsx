export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/ui/DataTable";
import { KeyRound, Monitor, AlertTriangle, Activity } from "lucide-react";
import { EXPIRING_SOON_DAYS, DEFAULT_LOCALE, PLANS, LICENSE_STATUSES } from "@/lib/constants";
import { daysUntil, calculateUtilization } from "@/lib/shared";
import CreateLicenseModal from "@/components/licenses/CreateLicenseModal";
import EditLicenseButton from "@/components/licenses/EditLicenseButton";
import DeleteLicenseButton from "@/components/licenses/DeleteLicenseButton";
import ToggleLicenseStatusButton from "@/components/licenses/ToggleLicenseStatusButton";
import RegenerateLicenseButton from "@/components/licenses/RegenerateLicenseButton";
import LicensingAdminActions from "@/components/licenses/LicensingAdminActions";
import Link from "next/link";

export default async function LicensesPage() {
  const licenses = await prisma.license.findMany({
    include: { activations: true },
    orderBy: { createdAt: "desc" },
  });

  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const suspendedLicenses = licenses.filter((l) => l.status === "SUSPENDED").length;
  const totalDevices = licenses.reduce((t, l) => t + l.activations.length, 0);
  const totalCapacity = licenses.reduce((t, l) => t + l.maxDevices, 0);
  const utilization = calculateUtilization(totalDevices, totalCapacity);
  const expiringSoon = licenses.filter((l) => {
    const d = daysUntil(l.expiresAt);
    return d >= 0 && d <= EXPIRING_SOON_DAYS;
  }).length;

  const planDistribution = licenses.reduce<Record<string, number>>((acc, l) => {
    acc[l.plan] = (acc[l.plan] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader
        title="License Management"
        description="Enterprise license operations, monitoring and lifecycle management."
        actions={
          <div className="flex items-center gap-3">
            <LicensingAdminActions />
            <CreateLicenseModal />
          </div>
        }
      />

      <StatCardGrid columns={6}>
        <StatCard title="Total Licenses" value={licenses.length} icon={KeyRound} color="blue" />
        <StatCard title="Active" value={activeLicenses} icon={Activity} color="green" subtitle={`${licenses.length > 0 ? Math.round((activeLicenses / licenses.length) * 100) : 0}% of total`} />
        <StatCard title="Suspended" value={suspendedLicenses} icon={AlertTriangle} color={suspendedLicenses > 0 ? "yellow" : "default"} />
        <StatCard title="Expiring Soon" value={expiringSoon} icon={Activity} color={expiringSoon > 0 ? "red" : "default"} subtitle={`Within ${EXPIRING_SOON_DAYS} days`} />
        <StatCard title="Active Devices" value={totalDevices} icon={Monitor} color="green" />
        <StatCard title="Utilization" value={`${utilization}%`} icon={Monitor} color={utilization > 80 ? "yellow" : "default"} subtitle={`${totalDevices}/${totalCapacity} devices`} />
      </StatCardGrid>

      {Object.keys(planDistribution).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(planDistribution).map(([plan, count]) => (
            <div key={plan} className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-sm text-zinc-300">
              {plan}: <span className="font-semibold text-zinc-100">{count}</span>
            </div>
          ))}
        </div>
      )}

      <DataTable
        columns={[
          { key: "key", label: "License Key", sortable: true, searchable: true },
          { key: "organization", label: "Organization", sortable: true, searchable: true },
          { key: "plan", label: "Plan", sortable: true },
          { key: "activations", label: "Devices", sortable: false },
          { key: "expiresAt", label: "Expiry", sortable: true },
          { key: "status", label: "Status", sortable: true },
          { key: "actions", label: "Actions", sortable: false, className: "w-48" },
        ]}
        rows={licenses.map((l) => {
          const expiry = new Date(l.expiresAt);
          const days = daysUntil(expiry);
          const color = days < 0 ? "text-red-400" : days <= EXPIRING_SOON_DAYS ? "text-yellow-400" : "text-zinc-300";
          return {
            id: String(l.id),
            values: {
              key: l.key,
              organization: l.organization,
              plan: l.plan,
              activations: `${l.activations.length}/${l.maxDevices}`,
              expiresAt: expiry.toISOString(),
              status: l.status,
              actions: "",
            },
            cells: [
              <Link href={`/licenses/${l.id}`} className="font-mono text-sm text-blue-400 transition-colors hover:text-blue-300 hover:underline">
                {l.key}
              </Link>,
              <>{l.organization}</>,
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium">{l.plan}</span>,
              <>{`${l.activations.length}/${l.maxDevices}`}</>,
              <span className={color}>
                {new Intl.DateTimeFormat(DEFAULT_LOCALE, { day: "2-digit", month: "short", year: "numeric" }).format(expiry)}
                {days >= 0 && days <= EXPIRING_SOON_DAYS && <span className="ml-2 text-xs text-yellow-500">({days}d)</span>}
                {days < 0 && <span className="ml-2 text-xs text-red-500">(expired)</span>}
              </span>,
              <StatusBadge status={l.status} />,
              <div className="flex items-center gap-1.5">
                <EditLicenseButton license={l as never} />
                <ToggleLicenseStatusButton id={l.id} status={l.status} size="sm" />
                <RegenerateLicenseButton id={l.id} size="sm" />
                <DeleteLicenseButton id={l.id} size="sm" />
              </div>,
            ],
          };
        })}
        searchPlaceholder="Search by license key or organization..."
        emptyMessage="No licenses found. Create your first license to get started."
      />
    </div>
  );
}
