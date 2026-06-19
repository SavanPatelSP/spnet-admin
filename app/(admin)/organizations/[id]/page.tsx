import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Organization Details" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import EditOrganizationModal from "@/components/organizations/EditOrganizationModal";
import {
  KeyRound, Monitor, Coins, Gem,
  Crown, Shield, ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatNumber } from "@/lib/shared";

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("View Organizations");
  const { id: orgName } = await params;

  const licenses = await prisma.license.findMany({
    where: { organization: orgName },
    include: { activations: true, coinBalance: true, gemBalance: true },
    orderBy: { createdAt: "desc" },
  });

  if (licenses.length === 0) notFound();

  const auditLogs = await prisma.auditLog.findMany({
    where: { organization: orgName },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = {
    licenseCount: licenses.length,
    activeCount: licenses.filter((l) => l.status === "ACTIVE").length,
    deviceCount: licenses.reduce((s, l) => s + l.activations.length, 0),
    totalCoins: licenses.reduce((s, l) => s + (l.coinBalance?.balance || 0), 0),
    totalGems: licenses.reduce((s, l) => s + (l.gemBalance?.balance || 0), 0),
    premiumLicenses: licenses.filter((l) => ["ENTERPRISE", "LIFETIME", "BUSINESS"].includes(l.plan)).length,
  };

  const licenseRows = licenses.map((l) => ({
    id: l.id,
    values: {
      key: l.key,
      plan: l.plan,
      status: l.status,
      devices: l.activations.length,
      maxDevices: l.maxDevices,
      coins: l.coinBalance?.balance || 0,
      gems: l.gemBalance?.balance || 0,
      expiresAt: formatDate(l.expiresAt),
    },
    cells: [
      <Link key="key" href={`/licenses/${l.id}`} className="font-medium text-blue-400 hover:underline">{l.key}</Link>,
      <span key="plan" className="text-sm">{l.plan}</span>,
      <span key="status" className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : l.status === "SUSPENDED" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>{l.status}</span>,
      <span key="devices" className="text-sm text-zinc-400">{l.activations.length}/{l.maxDevices}</span>,
      <span key="coins" className="text-sm text-zinc-400">{l.coinBalance?.balance || 0}</span>,
      <span key="gems" className="text-sm text-zinc-400">{l.gemBalance?.balance || 0}</span>,
      <span key="expiry" className="text-sm text-zinc-500">{formatDate(l.expiresAt)}</span>,
    ],
  }));

  const auditRows = auditLogs.map((a) => ({
    id: a.id,
    values: { action: a.action, description: a.description || "-", actor: a.actorName || "-", createdAt: formatDate(a.createdAt) },
    cells: [
      <span key="action" className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">{a.action}</span>,
      <span key="desc" className="text-sm text-zinc-400 truncate max-w-[300px]">{a.description || "-"}</span>,
      <span key="actor" className="text-sm text-zinc-500">{a.actorName || "-"}</span>,
      <span key="date" className="text-sm text-zinc-600">{formatDate(a.createdAt)}</span>,
    ],
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <PageHeader title={orgName} description="Organization overview and license portfolio." />
        <div className="pt-2">
          <EditOrganizationModal
            organization={orgName}
            licenses={licenses.map((l) => ({ id: l.id, key: l.key, plan: l.plan, status: l.status }))}
            stats={{
              licenseCount: stats.licenseCount,
              activeCount: stats.activeCount,
              deviceCount: stats.deviceCount,
              totalCoins: stats.totalCoins,
              totalGems: stats.totalGems,
              premiumCount: stats.premiumLicenses,
            }}
          />
        </div>
      </div>

      <StatCardGrid columns={4}>
        <StatCard title="Licenses" value={stats.licenseCount} icon={KeyRound} color="blue" subtitle={`${stats.activeCount} active`} />
        <StatCard title="Devices" value={formatNumber(stats.deviceCount)} icon={Monitor} color="green" />
        <StatCard title="Total Coins" value={formatNumber(stats.totalCoins)} icon={Coins} color="yellow" />
        <StatCard title="Total Gems" value={formatNumber(stats.totalGems)} icon={Gem} color="purple" />
      </StatCardGrid>

      <StatCardGrid columns={3}>
        <StatCard title="Premium Licenses" value={stats.premiumLicenses} icon={Crown} color="yellow" subtitle={`${licenses.length > 0 ? Math.round((stats.premiumLicenses / licenses.length) * 100) : 0}% of org`} />
        <StatCard title="Active Licenses" value={stats.activeCount} icon={Shield} color="green" />
        <StatCard title="Audit Events" value={auditLogs.length} icon={ClipboardList} color="default" />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Licenses</h2>
        </div>
        <DataTable
          columns={[
            { key: "key", label: "Key", sortable: true, searchable: true },
            { key: "plan", label: "Plan", sortable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "devices", label: "Devices", sortable: true },
            { key: "coins", label: "Coins", sortable: true },
            { key: "gems", label: "Gems", sortable: true },
            { key: "expiresAt", label: "Expires", sortable: true },
          ]}
          rows={licenseRows}
          searchPlaceholder="Search licenses..."
        />
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Audit History</h2>
          <span className="text-sm text-zinc-500">{auditLogs.length} events</span>
        </div>
        <DataTable
          columns={[
            { key: "action", label: "Action", sortable: true },
            { key: "description", label: "Description", searchable: true },
            { key: "actor", label: "Actor", sortable: true },
            { key: "createdAt", label: "Date", sortable: true },
          ]}
          rows={auditRows}
          pageSize={8}
        />
      </div>
    </div>
  );
}
