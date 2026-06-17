export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  LifeBuoy, MessageSquare, Clock, CheckCircle2,
  AlertTriangle, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/shared";

const priorityColors: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-400",
  HIGH: "bg-orange-500/10 text-orange-400",
  MEDIUM: "bg-yellow-500/10 text-yellow-400",
  LOW: "bg-green-500/10 text-green-400",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-500/10 text-blue-400",
  IN_PROGRESS: "bg-yellow-500/10 text-yellow-400",
  RESOLVED: "bg-green-500/10 text-green-400",
  CLOSED: "bg-zinc-500/10 text-zinc-400",
};

export default async function SupportPage() {
  await requirePermission("View Tickets");

  const [tickets, teamMembers] = await Promise.all([
    prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: { notes: true, license: { select: { key: true, organization: true } } },
    }),
    prisma.teamMember.findMany({ where: { status: "ACTIVE" } }),
  ]);

  const openTickets = tickets.filter((t) => t.status === "OPEN").length;
  const inProgress = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolved = tickets.filter((t) => t.status === "RESOLVED").length;
  const critical = tickets.filter((t) => t.priority === "CRITICAL" && t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const totalNotes = tickets.reduce((s, t) => s + t.notes.length, 0);

  const rows = tickets.map((t) => ({
    id: t.id,
    values: {
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      category: t.category,
      org: t.license?.organization || "-",
      assignedTo: t.assignedTo || "Unassigned",
      createdAt: formatDate(t.createdAt),
    },
    cells: [
      <Link key="subject" href={`/support/${t.id}`} className="font-medium text-blue-400 hover:underline">
        {t.subject}
      </Link>,
      <span key="priority" className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[t.priority] || ""}`}>{t.priority}</span>,
      <span key="status" className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[t.status] || ""}`}>{t.status.replace("_", " ")}</span>,
      <span key="cat" className="text-sm text-zinc-400">{t.category}</span>,
      <span key="org" className="text-sm text-zinc-500">{t.license?.organization || "-"}</span>,
      <span key="assigned" className="text-sm text-zinc-400">{typeof t.assignedTo === "string" && t.assignedTo.length > 0 ? (teamMembers.find(m => m.id === t.assignedTo)?.name || t.assignedTo.slice(0, 12)) : "-"}</span>,
      <span key="date" className="text-sm text-zinc-500">{formatDate(t.createdAt)}</span>,
    ],
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Support / Tickets"
        description="Manage support tickets and inquiries."
      />

      <StatCardGrid columns={5}>
        <StatCard title="Open Tickets" value={openTickets} icon={MessageSquare} color={openTickets > 0 ? "yellow" : "green"} subtitle={`${critical} critical`} />
        <StatCard title="In Progress" value={inProgress} icon={Clock} color="blue" />
        <StatCard title="Resolved" value={resolved} icon={CheckCircle2} color="green" />
        <StatCard title="Total Notes" value={totalNotes} icon={LifeBuoy} color="purple" />
        <StatCard title="Total Tickets" value={tickets.length} icon={AlertTriangle} color="default" subtitle={`${teamMembers.length} agents`} />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">All Tickets</h2>
          <span className="text-sm text-zinc-500">{tickets.length} total</span>
        </div>
        {tickets.length === 0 ? (
          <EmptyState
            title="No support tickets"
            description="Tickets will appear here when users submit support requests."
          />
        ) : (
          <DataTable
            columns={[
              { key: "subject", label: "Subject", sortable: true, searchable: true },
              { key: "priority", label: "Priority", sortable: true },
              { key: "status", label: "Status", sortable: true },
              { key: "category", label: "Category", sortable: true },
              { key: "org", label: "Organization", searchable: true },
              { key: "assignedTo", label: "Assigned To", sortable: true },
              { key: "createdAt", label: "Created", sortable: true },
            ]}
            rows={rows}
            pageSize={10}
            searchPlaceholder="Search tickets..."
          />
        )}
      </div>
    </div>
  );
}
