import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Coins Management" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Coins, TrendingUp, TrendingDown, Infinity } from "lucide-react";
import { CoinsBalancesTable } from "@/components/coins/CoinsBalancesTable";
import { CoinHistoryTable } from "@/components/coins/CoinHistoryTable";
import { CoinsAnalytics } from "@/components/coins/CoinsAnalytics";
import CoinsPageActions from "@/components/coins/CoinsPageActions";
import { TopCoinHolders } from "@/components/coins/TopCoinHolders";
import { CoinDistributionChart } from "@/components/coins/CoinDistributionChart";
import { EconomyHealthPanel } from "@/components/coins/EconomyHealthPanel";
import { SourceSinkTracking } from "@/components/coins/SourceSinkTracking";

export default async function CoinsPage() {
  await requirePermission("View Coin Balances");
  const [balances, transactions, searchLicenses] = await Promise.all([
    prisma.coinBalance.findMany({
      orderBy: { balance: "desc" },
    }),
    prisma.coinTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.license.findMany({
      select: { id: true, key: true, organization: true, plan: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const balanceMap = new Map(balances.map((b) => [b.licenseId, b.balance]));
  const searchLicensesMapped = searchLicenses.map((l) => ({
    licenseId: l.id,
    organization: l.organization,
    key: l.key,
    balance: balanceMap.get(l.id) || 0,
  }));

  const licenseData = new Map(searchLicenses.map(l => [l.id, l]));

  const totalCoins = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalCredits = transactions.filter((t) => t.type === "CREDIT" || t.type === "REFUND")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalDebits = transactions.filter((t) => t.type === "DEBIT")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const licensesWithBalance = balances.length;
  const topBalance = balances.length > 0 ? balances[0].balance : 0;
  const infiniteCount = balances.filter((b) => b.isInfinite).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coins Management"
        description="Manage coin balances, transactions, and refunds across all licenses."
      />

      <CoinsPageActions
        licenses={searchLicensesMapped}
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Coins" value={totalCoins.toLocaleString()} icon={Coins} color="yellow" subtitle={`Across ${licensesWithBalance} license${licensesWithBalance !== 1 ? "s" : ""}`} />
        <StatCard title="Infinite Wallets" value={infiniteCount} icon={Infinity} color="purple" subtitle="Unlimited coin balance" />
        <StatCard title="Total Credited" value={totalCredits.toLocaleString()} icon={TrendingUp} color="green" />
        <StatCard title="Total Debited" value={totalDebits.toLocaleString()} icon={TrendingDown} color="red" />
      </StatCardGrid>

      <CoinsAnalytics
        transactions={transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          createdAt: t.createdAt,
          reason: t.reason,
          performedBy: t.performedBy,
        }))}
        totalBalances={totalCoins}
        balanceCount={licensesWithBalance}
        topBalance={topBalance}
      />

      {balances.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <TopCoinHolders
              holders={balances.map((b) => {
                const lic = licenseData.get(b.licenseId) || { organization: "-", key: "-" };
                return { licenseId: b.licenseId, organization: lic.organization, key: lic.key, balance: b.balance };
              })}
            />
          </div>
          <div className="lg:col-span-1">
            <CoinDistributionChart
              balances={balances.map((b) => {
                const lic = licenseData.get(b.licenseId) || { organization: "-" };
                return { organization: lic.organization, balance: b.balance };
              })}
            />
          </div>
          <div className="lg:col-span-1">
            <EconomyHealthPanel
              transactions={transactions.map((t) => ({ type: t.type, amount: t.amount, createdAt: t.createdAt }))}
              totalSupply={totalCoins}
              activeHolders={licensesWithBalance}
            />
          </div>
          <div className="lg:col-span-1">
            <SourceSinkTracking
              transactions={transactions.map((t) => ({ id: t.id, type: t.type, amount: t.amount, reason: t.reason, performedBy: t.performedBy, createdAt: t.createdAt }))}
            />
          </div>
        </div>
      )}

      {balances.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Coin Balances</h2>
          <CoinsBalancesTable
            balances={balances.map((b) => {
              const lic = licenseData.get(b.licenseId) || { organization: "-", key: "-", plan: "-", status: "-" };
              return {
                id: b.id,
                licenseId: b.licenseId,
                organization: lic.organization,
                key: lic.key,
                plan: lic.plan,
                status: lic.status,
                balance: b.balance,
                type: b.type,
                isInfinite: b.isInfinite,
              };
            })}
          />
        </div>
      )}

      {transactions.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-bold">Transaction History</h2>
          <CoinHistoryTable
            transactions={transactions.map((t) => {
              const lic = licenseData.get(t.licenseId) || { organization: "-" };
              return {
                id: t.id,
                type: t.type,
                amount: t.amount,
                balanceAfter: t.balanceAfter,
                reason: t.reason,
                performedBy: t.performedBy,
                createdAt: t.createdAt,
                organization: lic.organization,
              };
            })}
          />
        </div>
      )}

      {balances.length === 0 && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <Coins size={32} className="text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300">No Coin Activity</h3>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Coin balances and transaction history will appear here once you start managing coins.
          </p>
        </div>
      )}
    </div>
  );
}
