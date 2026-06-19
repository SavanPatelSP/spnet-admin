import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ticket Details" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/shared";
import { TicketActions } from "./TicketActions";
import { TicketNotes } from "./TicketNotes";

const priorityColors: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-500/10",
  HIGH: "text-orange-400 bg-orange-500/10",
  MEDIUM: "text-yellow-400 bg-yellow-500/10",
  LOW: "text-green-400 bg-green-500/10",
};

const statusColors: Record<string, string> = {
  OPEN: "text-blue-400 bg-blue-500/10",
  IN_PROGRESS: "text-yellow-400 bg-yellow-500/10",
  RESOLVED: "text-green-400 bg-green-500/10",
  CLOSED: "text-zinc-400 bg-zinc-500/10",
};

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("View Tickets");
  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      license: { select: { key: true, organization: true } },
    },
  });

  if (!ticket) notFound();

  const teamMembers = await prisma.teamMember.findMany({ where: { status: "ACTIVE" } });
  const assignee = ticket.assignedTo ? teamMembers.find((m) => m.id === ticket.assignedTo) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={ticket.subject}
        description={`Ticket ${ticket.id.slice(0, 8)}...`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-bold">Description</h2>
            <p className="whitespace-pre-wrap text-zinc-300">{ticket.message}</p>
          </div>

          <TicketNotes ticketId={ticket.id} notes={ticket.notes} />
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 font-semibold">Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Status</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[ticket.status] || ""}`}>
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Priority</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[ticket.priority] || ""}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Category</span>
                <span className="text-zinc-300">{ticket.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Created</span>
                <span className="text-zinc-300">{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Assigned To</span>
                <span className="text-zinc-300">{assignee?.name || "Unassigned"}</span>
              </div>
              {ticket.license && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">License</span>
                  <span className="text-zinc-300">{ticket.license.key}</span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Resolved</span>
                  <span className="text-zinc-300">{formatDate(ticket.resolvedAt)}</span>
                </div>
              )}
            </div>
          </div>

          <TicketActions
            ticketId={ticket.id}
            currentStatus={ticket.status}
            currentAssignee={ticket.assignedTo}
            teamMembers={teamMembers.map((m) => ({ id: m.id, name: m.name }))}
          />
        </div>
      </div>
    </div>
  );
}
