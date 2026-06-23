import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Premium Requests" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/shared";
import PremiumRequestActions from "@/components/premium/PremiumRequestActions";
import Link from "next/link";

export default async function PremiumRequestsPage() {
  await requirePermission("View Premium");
  const [requests, counts] = await Promise.all([
    prisma.premiumRequest.findMany({
      orderBy: { submittedAt: "desc" },
      take: 500,
      include: {
        license: { select: { organization: true, key: true, plan: true } },
      },
    }),
    prisma.premiumRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const pendingCount = counts.find((c) => c.status === "PENDING")?._count.id || 0;
  const approvedCount = counts.find((c) => c.status === "APPROVED")?._count.id || 0;
  const rejectedCount = counts.find((c) => c.status === "REJECTED")?._count.id || 0;
  const totalCount = requests.length;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    EXPIRED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Premium Requests"
        description="Manage custom premium requests from users. Approve, reject, or convert requests to premium grants."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Requests" value={totalCount} icon={ClipboardList} color="blue" />
        <StatCard title="Pending" value={pendingCount} icon={Clock} color="yellow" subtitle="Awaiting review" />
        <StatCard title="Approved" value={approvedCount} icon={CheckCircle} color="green" />
        <StatCard title="Rejected" value={rejectedCount} icon={XCircle} color="red" />
      </StatCardGrid>

      <DataTable
        columns={[
          { key: "submittedAt", label: "Submitted", sortable: true },
          { key: "organization", label: "Organization", sortable: true, searchable: true },
          { key: "licenseKey", label: "License", sortable: true, searchable: true },
          { key: "requestedPlan", label: "Plan", sortable: true },
          { key: "duration", label: "Duration", sortable: true },
          { key: "reason", label: "Reason", searchable: true },
          { key: "status", label: "Status", sortable: true },
          { key: "submittedBy", label: "Submitted By", sortable: true },
          { key: "reviewedBy", label: "Reviewed By", sortable: true },
          { key: "actions", label: "Actions" },
        ]}
        rows={requests.map((r) => ({
          id: r.id,
          values: {
            submittedAt: r.submittedAt.toISOString(),
            organization: r.organization || r.license.organization,
            licenseKey: r.license.key,
            requestedPlan: r.requestedPlan,
            duration: `${r.requestedDurationDays} days`,
            reason: r.reason || "-",
            status: r.status,
            submittedBy: r.submittedBy || "-",
            reviewedBy: r.reviewedBy || "-",
          },
          cells: [
            <span key="submittedAt" className="text-sm text-zinc-400">{formatDateTime(r.submittedAt)}</span>,
            <Link key="organization" href={`/licenses/${r.licenseId}`} className="text-sm text-blue-400 hover:underline">
              {r.organization || r.license.organization}
            </Link>,
            <code key="licenseKey" className="text-xs font-mono text-zinc-400">{r.license.key}</code>,
            <span key="requestedPlan" className="font-medium">{r.requestedPlan}</span>,
            <span key="duration" className="text-sm text-zinc-400">{r.requestedDurationDays} days</span>,
            <span key="reason" className="text-sm text-zinc-300 max-w-xs truncate">{r.reason || "-"}</span>,
            <span key="status" className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status] || "bg-zinc-500/10 text-zinc-400"}`}>
              {r.status}
            </span>,
            <span key="submittedBy" className="text-sm text-zinc-400">{r.submittedBy || "-"}</span>,
            <span key="reviewedBy" className="text-sm text-zinc-400">{r.reviewedBy || "-"}</span>,
            <PremiumRequestActions
              key={`actions-${r.id}`}
              requestId={r.id}
              licenseId={r.licenseId}
              organization={r.organization || r.license.organization}
              requestedPlan={r.requestedPlan}
              requestedDurationDays={r.requestedDurationDays}
              reason={r.reason}
              status={r.status}
              submittedBy={r.submittedBy}
              licenseKey={r.license.key}
              convertedSubscriptionId={r.convertedSubscriptionId}
            />,
          ],
        }))}
        pageSize={15}
        searchPlaceholder="Search by organization, reason..."
        emptyMessage="No premium requests yet."
      />
    </div>
  );
}
