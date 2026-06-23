import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Gems Management" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { Gem, TrendingUp, Gift, Infinity } from "lucide-react";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { GemsAnalytics } from "@/components/gems/GemsAnalytics";
import GemsBalancesTable from "@/components/gems/GemsBalancesTable";
import AntiAbusePanel from "@/components/gems/AntiAbusePanel";
import GemsPageActions from "@/components/gems/GemsPageActions";
import DeleteRewardButton from "@/components/gems/DeleteRewardButton";
import RewardCampaignEditor from "@/components/gems/RewardCampaignEditor";
import { TopGemHolders } from "@/components/gems/TopGemHolders";
import { GemDistributionChart } from "@/components/gems/GemDistributionChart";

export default async function GemsPage() {
  await requirePermission("View Gem Balances");
  const [balances, transactions, rewards, allLicenses] = await Promise.all([
    prisma.gemBalance.findMany({
      include: { license: { select: { organization: true, key: true, plan: true, status: true } } },
      orderBy: { balance: "desc" },
    }),
    prisma.gemTransaction.findMany({
      include: {
        license: { select: { organization: true, key: true } },
        reward: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    prisma.gemReward.findMany({ orderBy: { name: "asc" } }),
    prisma.license.findMany({
      select: { id: true, key: true, organization: true, plan: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalGems = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalGranted = transactions.filter((t) => t.type === "GRANT" || t.type === "REWARD")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  transactions.filter((t) => t.type === "REVOKE")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const topBalance = balances.length > 0 ? balances[0].balance : 0;
  const infiniteCount = balances.filter((b) => b.isInfinite).length;

  const typeColors: Record<string, string> = {
    GRANT: "bg-green-500/10 text-green-400 border-green-500/20",
    REVOKE: "bg-red-500/10 text-red-400 border-red-500/20",
    REWARD: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    ADJUSTMENT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };

  const rewardOptions = rewards.map((r) => ({
    id: r.id, name: r.name, amount: r.amount, description: r.description, category: r.category,
  }));

  const balanceMap = new Map(balances.map((b) => [b.licenseId, b.balance]));
  const searchLicenses = allLicenses.map((l) => ({
    licenseId: l.id,
    organization: l.organization,
    key: l.key,
    balance: balanceMap.get(l.id) || 0,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gems Management"
        description="Manage gem balances, grant rewards, and monitor transactions."
      />

      <GemsPageActions
        licenses={searchLicenses}
        rewards={rewardOptions}
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Gems" value={totalGems.toLocaleString()} icon={Gem} color="purple" subtitle={`Across ${balances.length} license${balances.length !== 1 ? "s" : ""}`} />
        <StatCard title="Infinite Wallets" value={infiniteCount} icon={Infinity} color="purple" subtitle="Unlimited gem balance" />
        <StatCard title="Total Granted" value={totalGranted.toLocaleString()} icon={TrendingUp} color="green" />
        <StatCard title="Reward Templates" value={rewards.length} icon={Gift} color="blue" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <GemsAnalytics
            transactions={transactions.map((t) => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              createdAt: t.createdAt,
              reason: t.reason,
              performedBy: t.performedBy,
            }))}
            totalGems={totalGems}
            balanceCount={balances.length}
            topBalance={topBalance}
            rewardCount={rewards.length}
          />
        </div>
        <div>
          <AntiAbusePanel
            transactions={transactions.map((t) => ({
              id: t.id,
              type: t.type,
              amount: t.amount,
              createdAt: t.createdAt,
              reason: t.reason,
              performedBy: t.performedBy,
            }))}
          />
        </div>
        <div className="space-y-6">
          <TopGemHolders
            holders={balances.map((b) => ({
              licenseId: b.licenseId,
              organization: b.license.organization,
              key: b.license.key,
              balance: b.balance,
            }))}
          />
          <GemDistributionChart
            balances={balances.map((b) => ({ organization: b.license.organization, balance: b.balance }))}
          />
        </div>
      </div>

      {rewards.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Reward Campaigns</h2>
            <RewardCampaignEditor />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {rewards.map((r) => (
              <div key={r.id} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {r.icon && <span className="text-lg">{r.icon}</span>}
                    <h3 className="font-bold">{r.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      r.active ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-zinc-600 bg-zinc-800 text-zinc-500"
                    }`}>{r.active ? "Active" : "Inactive"}</span>
                    <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
                      {r.category}
                    </span>
                  </div>
                </div>
                {r.description && <p className="mt-2 text-sm text-zinc-400">{r.description}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-bold text-purple-400">{r.amount} gems</span>
                  {r.cooldownDays && <span className="text-zinc-500">Cooldown: {r.cooldownDays}d</span>}
                  {r.maxClaims && <span className="text-zinc-500">Max: {r.maxClaims} claims</span>}
                  {r.budget && <span className="text-zinc-500">Budget: {r.budget} gems</span>}
                  {r.startDate && (
                    <span className="text-zinc-500">
                      {new Date(r.startDate).toLocaleDateString("en-US")} - {r.endDate ? new Date(r.endDate).toLocaleDateString("en-US") : "∞"}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <RewardCampaignEditor
                    reward={{
                      id: r.id,
                      name: r.name,
                      description: r.description,
                      amount: r.amount,
                      category: r.category,
                      active: r.active,
                      cooldownDays: r.cooldownDays,
                      maxClaims: r.maxClaims,
                      budget: r.budget,
                      icon: r.icon,
                      startDate: r.startDate ? r.startDate.toISOString() : null,
                      endDate: r.endDate ? r.endDate.toISOString() : null,
                    }}
                    trigger={<button className="rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700">Edit</button>}
                  />
                  <DeleteRewardButton rewardId={r.id} rewardName={r.name} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rewards.length > 0 && !(balances.length === 0 && transactions.length === 0) && (
        <div className="flex justify-end">
          <RewardCampaignEditor trigger={<button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">+ New Campaign</button>} />
        </div>
      )}

      {balances.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Gem Balances</h2>
          <GemsBalancesTable
            balances={balances.map((b) => ({
              id: b.id,
              licenseId: b.licenseId,
              organization: b.license.organization,
              key: b.license.key,
              plan: b.license.plan,
              status: b.license.status,
              balance: b.balance,
              type: b.type,
              isInfinite: b.isInfinite,
            }))}
            rewards={rewardOptions}
          />
        </div>
      )}

      {transactions.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Transaction History</h2>
          <DataTable
            columns={[
              { key: "date", label: "Date", sortable: true },
              { key: "organization", label: "Organization", sortable: true, searchable: true },
              { key: "type", label: "Type", sortable: true },
              { key: "amount", label: "Amount", sortable: true },
              { key: "balanceAfter", label: "Balance After", sortable: true },
              { key: "reason", label: "Reason", sortable: false, searchable: true },
              { key: "performedBy", label: "By", sortable: true },
            ]}
            rows={transactions.map((t) => ({
              id: t.id,
              values: {
                date: t.createdAt.toISOString(),
                organization: t.license.organization,
                type: t.reward?.name || t.type,
                amount: t.amount,
                balanceAfter: t.balanceAfter,
                reason: t.reason || "-",
                performedBy: t.performedBy || "-",
              },
              cells: [
                <span key="date" className="text-zinc-300">
                  {new Intl.DateTimeFormat(DEFAULT_LOCALE, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(t.createdAt)}
                </span>,
                <span key="organization">{t.license.organization}</span>,
                <span key="type" className="flex items-center gap-1">
                  {t.reward && <Gift size={14} className="text-purple-400" />}
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[t.type] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`}>
                    {t.reward?.name || t.type}
                  </span>
                </span>,
                <span key="amount" className={t.amount > 0 ? "font-medium text-green-400" : "font-medium text-red-400"}>
                  {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                </span>,
                <span key="balanceAfter" className="font-mono text-sm">{t.balanceAfter.toLocaleString()}</span>,
                <span key="reason" className="text-sm text-zinc-400">{t.reason || "-"}</span>,
                <span key="performedBy" className="text-sm text-zinc-500">{t.performedBy || "-"}</span>,
              ],
            }))}
            pageSize={15}
            searchPlaceholder="Search by organization or reason..."
            emptyMessage="No transactions yet."
          />
        </div>
      )}

      {balances.length === 0 && transactions.length === 0 && rewards.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <Gem size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300">No Gem Activity</h3>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Gem balances, transactions, and rewards will appear here once you start managing gems.
          </p>
        </div>
      )}
    </div>
  );
}
