import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Waitlist Management" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { getWaitlistStats, getWaitlistEntries, getWaitlistAnalytics, getInviteCodes } from "@/lib/waitlist";
import { formatDateTime, formatNumber } from "@/lib/shared";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Users, UserPlus, TrendingUp, Percent,
  Globe, BarChart3, Activity, Mail,
  Download, CheckCircle2, Clock, XCircle,
  ArrowRight, Gift, Trophy,
} from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  PENDING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  CONVERTED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  INVITED: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default async function WaitlistPage() {
  await requirePermission("View Users");

  const [stats, analytics, inviteCodes] = await Promise.all([
    getWaitlistStats(),
    getWaitlistAnalytics(),
    getInviteCodes(),
  ]);

  const entriesResult = await getWaitlistEntries({ limit: 100 });
  const entries = entriesResult.entries;
  const totalEntries = entriesResult.total;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Waitlist Management"
        description="Manage signups, referrals, invites, and early access for the SPNETGRAM platform."
      />

      <StatCardGrid columns={6}>
        <StatCard title="Total Signups" value={formatNumber(stats.total)} icon={Users} color="blue" />
        <StatCard title="Today" value={stats.today} icon={Activity} color="green" />
        <StatCard title="This Week" value={stats.thisWeek} icon={BarChart3} color="purple" />
        <StatCard title="This Month" value={stats.thisMonth} icon={TrendingUp} color="yellow" />
        <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={Percent} color="green" />
        <StatCard title="Referral Rate" value={`${stats.referralRate}%`} icon={Gift} color="purple" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Status Distribution">
          <div className="space-y-2">
            {stats.statusCounts.map((s: any) => (
              <div key={s.status} className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[s.status] || "bg-zinc-500/10 text-zinc-400"}`}>
                  {s.status}
                </span>
                <span className="text-sm font-medium text-zinc-100">{s._count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Country Distribution">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {analytics.countryDistribution.map((c: any) => (
              <div key={c.country || "unknown"} className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-zinc-500">
                  <Globe size={12} />
                  {c.country || "Unknown"}
                </span>
                <span className="text-sm font-medium text-zinc-100">{c._count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Referral Leaders" actions={
          <span className="text-xs text-zinc-500">
            <Trophy size={12} className="inline mr-1 text-yellow-400" />
            Top 10
          </span>
        }>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {analytics.referralLeaders.length === 0 ? (
              <div className="text-sm text-zinc-500 py-4 text-center">No referrals yet.</div>
            ) : (
              analytics.referralLeaders.map((r: any, i: number) => (
                <div key={r.email} className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                      {i + 1}
                    </span>
                    <span className="text-sm text-zinc-300 truncate">{r.fullName || r.email}</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-400">{r.referralCount}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card title="Invite Codes" actions={
        <Link href="/waitlist/invite-codes" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
          Manage <ArrowRight size={12} />
        </Link>
      }>
        {inviteCodes.length === 0 ? (
          <div className="text-sm text-zinc-500 py-4 text-center">No invite codes generated yet.</div>
        ) : (
          <div className="space-y-2">
            {inviteCodes.slice(0, 5).map((code) => (
              <div key={code.id} className="flex items-center justify-between rounded-lg bg-zinc-800/30 px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-zinc-200">{code.code}</span>
                  <span className="text-xs text-zinc-500">{code.usedCount}/{code.maxUses} used</span>
                </div>
                <StatusBadge status={code.active ? "ACTIVE" : "DISABLED"} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Waitlist Entries" actions={
        <Link href="/waitlist/export" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
          <Download size={12} /> Export
        </Link>
      }>
        <DataTable
          columns={[
            { key: "position", label: "#", sortable: true },
            { key: "fullName", label: "Name", sortable: true, searchable: true },
            { key: "email", label: "Email", sortable: true, searchable: true },
            { key: "country", label: "Country", sortable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "referrals", label: "Referrals", sortable: true },
            { key: "referralCode", label: "Referral Code", sortable: true },
            { key: "createdAt", label: "Signed Up", sortable: true },
          ]}
          rows={entries.map((entry) => ({
            id: entry.id,
            values: {
              position: entry.position,
              fullName: entry.fullName,
              email: entry.email,
              country: entry.country || "",
              status: entry.status,
              referrals: entry.referralCount,
              referralCode: entry.ownReferralCode,
              createdAt: entry.createdAt.toISOString(),
            },
            cells: [
              <span key="pos" className="text-sm font-medium text-zinc-400">#{entry.position}</span>,
              <span key="name" className="text-sm text-zinc-200">{entry.fullName}</span>,
              <span key="email" className="text-sm text-zinc-400">{entry.email}</span>,
              <span key="country" className="text-sm text-zinc-400">{entry.country || "-"}</span>,
              <span key="status"><StatusBadge status={entry.status} /></span>,
              <span key="refs" className="text-sm font-medium text-yellow-400">{entry.referralCount}</span>,
              <span key="rc" className="font-mono text-xs text-zinc-500">{entry.ownReferralCode}</span>,
              <span key="date" className="text-xs text-zinc-500">{formatDateTime(entry.createdAt)}</span>,
            ],
          }))}
          pageSize={15}
          searchPlaceholder="Search by name or email..."
          emptyMessage="No waitlist entries yet."
        />
      </Card>
    </div>
  );
}
