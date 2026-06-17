export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Building2, Crown,
  TrendingUp, Monitor,
} from "lucide-react";
import Link from "next/link";
import { EXPIRING_SOON_DAYS } from "@/lib/constants";
import { daysUntil, formatNumber } from "@/lib/shared";

export default async function OrganizationsPage() {
  await requirePermission("View Organizations");

  const [licenses, auditLogs, coinBalances, gemBalances, premiumSubs] = await Promise.all([
    prisma.license.findMany({
      include: { activations: true },
      orderBy: { organization: "asc" },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.coinBalance.findMany({ include: { license: { select: { organization: true } } } }),
    prisma.gemBalance.findMany({ include: { license: { select: { organization: true } } } }),
    prisma.premiumSubscription.findMany(),
  ]);

  const orgMap = licenses.reduce<Record<string, typeof licenses>>((acc, l) => {
    if (!acc[l.organization]) acc[l.organization] = [];
    acc[l.organization].push(l);
    return acc;
  }, {});

  const orgEntries = Object.entries(orgMap)
    .map(([org, lic]) => {
      const orgCoinBal = coinBalances.filter((c) => lic.some((l) => l.id === c.licenseId));
      const orgGemBal = gemBalances.filter((g) => lic.some((l) => l.id === g.licenseId));
      const orgAuditLogs = auditLogs.filter((a) => a.organization === org);
      const orgPremium = premiumSubs.filter((p) => lic.some((l) => l.id === p.licenseId));
      return {
        organization: org,
        licenseCount: lic.length,
        activeCount: lic.filter((l) => l.status === "ACTIVE").length,
        deviceCount: lic.reduce((s, l) => s + l.activations.length, 0),
        plans: [...new Set(lic.map((l) => l.plan))].join(", "),
        isPremium: lic.some((l) => ["ENTERPRISE", "LIFETIME", "BUSINESS"].includes(l.plan)),
        totalCoins: orgCoinBal.reduce((s, c) => s + c.balance, 0),
        totalGems: orgGemBal.reduce((s, g) => s + g.balance, 0),
        auditCount: orgAuditLogs.length,
        premiumCount: orgPremium.length,
        expiringSoon: lic.filter((l) => daysUntil(l.expiresAt) >= 0 && daysUntil(l.expiresAt) <= EXPIRING_SOON_DAYS).length,
      };
    })
    .sort((a, b) => b.licenseCount - a.licenseCount);

  const totalOrgs = orgEntries.length;
  const totalLicenses = licenses.length;
  const totalDevices = licenses.reduce((s, l) => s + l.activations.length, 0);
  const premiumOrgs = orgEntries.filter((o) => o.isPremium).length;

  const rows = orgEntries.map((o, i) => ({
    id: String(i),
    values: {
      organization: o.organization,
      licenses: o.licenseCount,
      active: o.activeCount,
      devices: o.deviceCount,
      premium: o.isPremium ? "Yes" : "No",
      coins: o.totalCoins,
      gems: o.totalGems,
      audits: o.auditCount,
    },
    cells: [
      <Link key="org" href={`/organizations/${encodeURIComponent(o.organization)}`} className="flex items-center gap-2 font-medium text-blue-400 hover:underline">
        {o.isPremium && <Crown size={14} className="text-yellow-400 shrink-0" />}
        {o.organization}
      </Link>,
      <span key="count" className="font-medium">{o.licenseCount}</span>,
      <ActivityIcon key="active" active={o.activeCount} total={o.licenseCount} />,
      <span key="devices">{o.deviceCount}</span>,
      <span key="coins" className="text-sm text-zinc-400">{formatNumber(o.totalCoins)}</span>,
      <span key="gems" className="text-sm text-zinc-400">{formatNumber(o.totalGems)}</span>,
      <span key="audits" className="text-sm text-zinc-500">{o.auditCount}</span>,
    ],
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Organizations"
        description="View all organizations and their license portfolios."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Organizations" value={totalOrgs} icon={Building2} color="blue" subtitle={`${formatNumber(totalLicenses)} licenses`} />
        <StatCard title="Premium Orgs" value={premiumOrgs} icon={Crown} color="yellow" subtitle={`${totalOrgs > 0 ? Math.round((premiumOrgs / totalOrgs) * 100) : 0}% of orgs`} />
        <StatCard title="Total Devices" value={formatNumber(totalDevices)} icon={Monitor} color="green" />
        <StatCard title="Avg Licenses/Org" value={totalOrgs > 0 ? (totalLicenses / totalOrgs).toFixed(1) : "0"} icon={TrendingUp} color="purple" />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        {rows.length === 0 ? (
          <EmptyState title="No organizations found" description="Organizations are created when licenses are issued." />
        ) : (
          <DataTable
            columns={[
              { key: "organization", label: "Organization", sortable: true, searchable: true },
              { key: "licenses", label: "Licenses", sortable: true },
              { key: "active", label: "Active", sortable: true },
              { key: "devices", label: "Devices", sortable: true },
              { key: "coins", label: "Coins", sortable: true },
              { key: "gems", label: "Gems", sortable: true },
              { key: "audits", label: "Audits", sortable: true },
            ]}
            rows={rows}
            searchPlaceholder="Search organizations..."
            emptyMessage="No organizations found."
          />
        )}
      </div>
    </div>
  );
}

function ActivityIcon({ active, total }: { active: number; total: number }) {
  const pct = total > 0 ? Math.round((active / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-12 overflow-hidden rounded-full bg-zinc-700">
        <div className={`h-full rounded-full ${pct > 80 ? "bg-green-500" : pct > 50 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500">{pct}%</span>
    </div>
  );
}
