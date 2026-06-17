export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Megaphone, Users, Send, Clock, FileEdit, CheckCircle2, XCircle } from "lucide-react";
import { CreateBroadcastForm } from "./CreateBroadcastForm";
import { BroadcastActions } from "./BroadcastActions";
import { formatDate } from "@/lib/shared";

export default async function BroadcastsPage() {
  const [teamMembers, licenses, broadcasts] = await Promise.all([
    prisma.teamMember.findMany(),
    prisma.license.findMany(),
    prisma.broadcast.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const drafts = broadcasts.filter((b) => b.status === "DRAFT").length;
  const scheduled = broadcasts.filter((b) => b.status === "SCHEDULED").length;
  const sent30d = broadcasts.filter(
    (b) => b.status === "SENT" && b.sentAt && b.sentAt > new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
  ).length;
  const totalSent = broadcasts.filter((b) => b.status === "SENT").length;

  const rows = broadcasts.map((b) => ({
    id: b.id,
    values: {
      subject: b.subject,
      type: b.type,
      audience: b.audience,
      status: b.status,
      sentCount: b.sentCount,
      scheduledAt: b.scheduledAt ? formatDate(b.scheduledAt) : "-",
      createdAt: formatDate(b.createdAt),
    },
    cells: [
      <span key="subject" className="font-medium">{b.subject}</span>,
      <span key="type" className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        b.type === "CRITICAL" ? "bg-red-500/10 text-red-400" :
        b.type === "WARNING" ? "bg-yellow-500/10 text-yellow-400" :
        "bg-blue-500/10 text-blue-400"
      }`}>{b.type}</span>,
      <span key="audience" className="text-sm text-zinc-400">{b.audience}</span>,
      <span key="status" className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        b.status === "SENT" ? "bg-green-500/10 text-green-400" :
        b.status === "SCHEDULED" ? "bg-blue-500/10 text-blue-400" :
        b.status === "DRAFT" ? "bg-zinc-500/10 text-zinc-400" :
        "bg-red-500/10 text-red-400"
      }`}>{b.status}</span>,
      <span key="sent" className="text-sm text-zinc-400">{b.status === "SENT" ? b.sentCount : "-"}</span>,
      <span key="scheduled" className="text-sm text-zinc-500">{b.scheduledAt ? formatDate(b.scheduledAt) : "-"}</span>,
      <span key="actions"><BroadcastActions broadcast={b} /></span>,
    ],
  }));

  return (
    <div className="space-y-8">
      <PageHeader title="Broadcasts" description="Send announcements and notifications to users." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Sent" value={totalSent} icon={Send} color="green" subtitle="All time" />
        <StatCard title="Sent (30d)" value={sent30d} icon={Megaphone} color="blue" subtitle="Last 30 days" />
        <StatCard title="Scheduled" value={scheduled} icon={Clock} color="yellow" subtitle="Pending delivery" />
        <StatCard title="Drafts" value={drafts} icon={FileEdit} color="purple" subtitle="Not yet sent" />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">Create Broadcast</h2>
        <CreateBroadcastForm />
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Broadcast History</h2>
          <span className="text-sm text-zinc-500">{broadcasts.length} total</span>
        </div>
        {broadcasts.length === 0 ? (
          <EmptyState
            title="No broadcasts yet"
            description="Create your first broadcast above."
          />
        ) : (
          <DataTable
            columns={[
              { key: "subject", label: "Subject", sortable: true, searchable: true },
              { key: "type", label: "Type", sortable: true },
              { key: "audience", label: "Audience", sortable: true },
              { key: "status", label: "Status", sortable: true },
              { key: "sentCount", label: "Sent", sortable: true },
              { key: "scheduledAt", label: "Scheduled", sortable: true },
              { key: "actions", label: "Actions" },
            ]}
            rows={rows}
            pageSize={8}
            searchPlaceholder="Search broadcasts..."
          />
        )}
      </div>
    </div>
  );
}
