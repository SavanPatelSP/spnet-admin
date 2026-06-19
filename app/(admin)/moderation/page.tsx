import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Moderation" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AlertTriangle, Ban, CheckCircle2,
  FileWarning,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/shared";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400",
  INVESTIGATING: "bg-blue-500/10 text-blue-400",
  RESOLVED: "bg-green-500/10 text-green-400",
  DISMISSED: "bg-zinc-500/10 text-zinc-400",
};

const actionColors: Record<string, string> = {
  WARNING: "bg-yellow-500/10 text-yellow-400",
  SUSPENSION: "bg-red-500/10 text-red-400",
  BAN: "bg-red-600/10 text-red-500",
  REINSTATEMENT: "bg-green-500/10 text-green-400",
  NONE: "bg-zinc-500/10 text-zinc-400",
};

export default async function ModerationPage() {
  await requirePermission("Moderate Content");

  const [reports, actions] = await Promise.all([
    prisma.moderationReport.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.moderationAction.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const pendingReports = reports.filter((r) => r.status === "PENDING").length;
  const investigating = reports.filter((r) => r.status === "INVESTIGATING").length;
  const resolvedReports = reports.filter((r) => r.status === "RESOLVED").length;
  const activeSuspensions = actions.filter(
    (a) => a.actionType === "SUSPENSION" && (!a.expiresAt || a.expiresAt > new Date()),
  ).length;

  const reportRows = reports.map((r) => ({
    id: r.id,
    values: {
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      status: r.status,
      actionTaken: r.actionTaken || "-",
      reporter: r.reporterId || "System",
      createdAt: formatDate(r.createdAt),
    },
    cells: [
      <span key="type" className="text-sm">{r.targetType}</span>,
      <Link key="target" href={`/moderation/${r.id}`} className="text-xs text-blue-400 hover:underline">{r.targetId.slice(0, 12)}...</Link>,
      <span key="reason" className="text-sm text-zinc-300 max-w-[200px] truncate">{r.reason}</span>,
      <span key="status" className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[r.status] || ""}`}>{r.status}</span>,
      <span key="action" className={`text-xs font-medium px-2 py-0.5 rounded-full ${actionColors[r.actionTaken || ""] || ""}`}>{r.actionTaken || "-"}</span>,
      <span key="reporter" className="text-sm text-zinc-500">{r.reporterId || "-"}</span>,
      <span key="date" className="text-sm text-zinc-500">{formatDate(r.createdAt)}</span>,
    ],
  }));

  const actionRows = actions.map((a) => ({
    id: a.id,
    values: {
      actionType: a.actionType,
      targetType: a.targetType,
      targetId: a.targetId,
      reason: a.reason,
      performedBy: a.performedBy || "System",
      createdAt: formatDate(a.createdAt),
    },
    cells: [
      <span key="action" className={`text-xs font-medium px-2 py-0.5 rounded-full ${actionColors[a.actionType] || ""}`}>{a.actionType}</span>,
      <span key="type" className="text-sm">{a.targetType}</span>,
      <span key="target" className="text-xs text-zinc-500">{a.targetId.slice(0, 12)}...</span>,
      <span key="reason" className="text-sm text-zinc-400 max-w-[200px] truncate">{a.reason}</span>,
      <span key="by" className="text-sm text-zinc-500">{a.performedBy || "-"}</span>,
      <span key="date" className="text-sm text-zinc-500">{formatDate(a.createdAt)}</span>,
    ],
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Moderation"
        description="Manage reports, warnings, and suspensions."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Pending Reports" value={pendingReports} icon={AlertTriangle} color={pendingReports > 0 ? "yellow" : "green"} subtitle={`${investigating} investigating`} />
        <StatCard title="Resolved" value={resolvedReports} icon={CheckCircle2} color="green" />
        <StatCard title="Active Suspensions" value={activeSuspensions} icon={Ban} color={activeSuspensions > 0 ? "red" : "default"} />
        <StatCard title="Total Actions" value={actions.length} icon={FileWarning} color="purple" />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Reports Queue</h2>
          <span className="text-sm text-zinc-500">{reports.length} total</span>
        </div>
        {reports.length === 0 ? (
          <EmptyState title="No reports" description="All clear — no moderation reports have been filed." />
        ) : (
          <DataTable
            columns={[
              { key: "targetType", label: "Type", sortable: true },
              { key: "targetId", label: "Target" },
              { key: "reason", label: "Reason", sortable: true, searchable: true },
              { key: "status", label: "Status", sortable: true },
              { key: "actionTaken", label: "Action" },
              { key: "reporter", label: "Reporter", searchable: true },
              { key: "createdAt", label: "Date", sortable: true },
            ]}
            rows={reportRows}
            pageSize={10}
            searchPlaceholder="Search reports..."
          />
        )}
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Moderation Actions</h2>
          <span className="text-sm text-zinc-500">{actions.length} total</span>
        </div>
        {actions.length === 0 ? (
          <p className="text-sm text-zinc-500">No moderation actions taken yet.</p>
        ) : (
          <DataTable
            columns={[
              { key: "actionType", label: "Action", sortable: true },
              { key: "targetType", label: "Target Type" },
              { key: "targetId", label: "Target" },
              { key: "reason", label: "Reason", sortable: true, searchable: true },
              { key: "performedBy", label: "By" },
              { key: "createdAt", label: "Date", sortable: true },
            ]}
            rows={actionRows}
            pageSize={8}
            searchPlaceholder="Search actions..."
          />
        )}
      </div>
    </div>
  );
}
