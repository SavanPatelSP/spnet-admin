export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { ClipboardList, Users, Building2, CalendarDays } from "lucide-react";
import { formatDateTime } from "@/lib/shared";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const totalLogs = logs.length;
  const todayLogs = logs.filter((log) => new Date(log.createdAt).toDateString() === new Date().toDateString()).length;
  const uniqueUsers = new Set(logs.map((log) => log.actorName).filter(Boolean)).size;
  const uniqueOrganizations = new Set(logs.map((log) => log.organization).filter(Boolean)).size;

  const actionCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit Logs"
        description="Enterprise activity tracking and security auditing. All actions are logged immutably."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Events" value={totalLogs} icon={ClipboardList} color="blue" />
        <StatCard title="Today's Events" value={todayLogs} icon={CalendarDays} color="green" subtitle="Last 24 hours" />
        <StatCard title="Unique Actors" value={uniqueUsers} icon={Users} color="purple" />
        <StatCard title="Organizations" value={uniqueOrganizations} icon={Building2} color="yellow" />
      </StatCardGrid>

      {Object.keys(actionCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(actionCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([action, count]) => (
              <div key={action} className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-sm text-zinc-300">
                {action}: <span className="font-semibold text-zinc-100">{count}</span>
              </div>
            ))}
        </div>
      )}

      <DataTable
        columns={[
          { key: "createdAt", label: "Time", sortable: true },
          { key: "action", label: "Action", sortable: true, searchable: true },
          { key: "organization", label: "Organization", sortable: true, searchable: true },
          { key: "actorRole", label: "Role", sortable: true },
          { key: "actorName", label: "User", sortable: true, searchable: true },
          { key: "description", label: "Description", sortable: false, searchable: true, className: "max-w-md" },
        ]}
        rows={logs.map((log) => ({
          id: log.id,
          values: {
            createdAt: log.createdAt.toISOString(),
            action: log.action,
            organization: log.organization || "",
            actorRole: log.actorRole || "",
            actorName: log.actorName || "",
            description: log.description || "",
          },
          cells: [
            <span key="createdAt" className="whitespace-nowrap text-sm">{formatDateTime(log.createdAt)}</span>,
            <span key="action" className="inline-block rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
              {log.action}
            </span>,
            <span key="organization">{log.organization || "-"}</span>,
            log.actorRole ? (
              <span key="actorRole" className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
                {log.actorRole}
              </span>
            ) : (
              <span key="actorRole">-</span>
            ),
            <span key="actorName">{log.actorName || "-"}</span>,
            <span key="description" className="text-sm text-zinc-300">{log.description || "-"}</span>,
          ],
        }))}
        pageSize={15}
        searchPlaceholder="Search by action, user, organization..."
        emptyMessage="No audit logs available yet. Actions will be recorded here as they occur."
      />
    </div>
  );
}
