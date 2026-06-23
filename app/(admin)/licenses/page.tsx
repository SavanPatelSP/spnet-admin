import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Licenses" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { KeyRound, Monitor, AlertTriangle, Activity, LayoutTemplate, FlaskConical, ArrowRightLeft } from "lucide-react";
import { EXPIRING_SOON_DAYS } from "@/lib/constants";
import { daysUntil, calculateUtilization } from "@/lib/shared";
import CreateLicenseModal from "@/components/licenses/CreateLicenseModal";
import LicensingAdminActions from "@/components/licenses/LicensingAdminActions";
import { LicensesTable } from "@/components/licenses/LicensesTable";
import LicenseTemplatesManager from "@/components/licenses/LicenseTemplatesManager";
import BulkCreateButton from "./BulkCreateButton";

export default async function LicensesPage() {
  await requirePermission("View Licenses");
  const [licenses, templates, trialLicenses, transferredLicenses] = await Promise.all([
    prisma.license.findMany({
      include: { _count: { select: { activations: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.licenseTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.license.count({
      where: { trialStartDate: { not: null }, trialEndDate: { not: null } },
    }),
    prisma.license.count({
      where: { parentLicenseId: { not: null } },
    }),
  ]);

  const activeLicenses = licenses.filter((l) => l.status === "ACTIVE").length;
  const suspendedLicenses = licenses.filter((l) => l.status === "SUSPENDED").length;
  const totalDevices = licenses.reduce((t, l) => t + l._count.activations, 0);
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

  const templatePlanDistribution = templates.reduce<Record<string, number>>((acc, t) => {
    acc[t.plan] = (acc[t.plan] || 0) + 1;
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
            <BulkCreateButton templates={templates.map((t) => ({ id: t.id, name: t.name }))} />
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

      <StatCardGrid columns={3}>
        <StatCard title="Templates" value={templates.length} icon={LayoutTemplate} color="blue" subtitle="Available license templates" />
        <StatCard title="Trial Licenses" value={trialLicenses} icon={FlaskConical} color="yellow" subtitle="With trial dates set" />
        <StatCard title="Transferred" value={transferredLicenses} icon={ArrowRightLeft} color="purple" subtitle="Licenses with parent" />
      </StatCardGrid>

      <LicenseTemplatesManager />

      {Object.keys(planDistribution).length > 0 && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Plan Distribution</h2>
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-400">Licenses by Plan</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(planDistribution).map(([plan, count]) => (
                  <div key={plan} className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-sm text-zinc-300">
                    {plan}: <span className="font-semibold text-zinc-100">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            {Object.keys(templatePlanDistribution).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-400">Templates by Plan</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(templatePlanDistribution).map(([plan, count]) => (
                    <div key={plan} className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-sm text-zinc-300">
                      {plan}: <span className="font-semibold text-zinc-100">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <LicensesTable licenses={licenses as never} />
    </div>
  );
}
