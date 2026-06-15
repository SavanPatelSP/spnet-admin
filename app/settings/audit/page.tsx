export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { formatDateTime } from "@/lib/shared";
import { ClipboardList, CalendarDays, Users, Archive } from "lucide-react";
import { AUDIT_RETENTION_DAYS } from "@/lib/constants";

export default async function AuditSettingsPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" } });

  const uniqueActions = [...new Set(logs.map((l) => l.action))].length;
  const oldestLog = logs.length > 0 ? logs[logs.length - 1].createdAt : null;
  const daysSinceOldest = oldestLog
    ? Math.max(1, Math.ceil((Date.now() - new Date(oldestLog).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const averageDaily = Math.round(logs.length / daysSinceOldest);

  const actionBreakdown = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader title="Audit Configuration" description="Retention policies, exports, alerts and compliance settings." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Events" value={logs.length} icon={ClipboardList} color="blue" />
        <StatCard title="Unique Actions" value={uniqueActions} icon={CalendarDays} color="green" />
        <StatCard title="Unique Actors" value={new Set(logs.map((l) => l.actorName).filter(Boolean)).size} icon={Users} color="purple" />
        <StatCard title="Avg. Daily" value={averageDaily} icon={Archive} color="yellow" subtitle="Events per day" />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Retention & Policy</h2>
          <div className="space-y-4">
            <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">Retention Period</span>
              <span className="font-medium">{AUDIT_RETENTION_DAYS} days</span>
            </div>
            <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">Oldest Record</span>
              <span className="font-medium">{oldestLog ? formatDateTime(oldestLog) : "N/A"}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
              <span className="text-zinc-400">Total Records</span>
              <span className="font-medium">{logs.length}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-xl font-bold">Action Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(actionBreakdown)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([action, count]) => (
                <div key={action} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-2.5">
                  <span className="text-sm font-medium">{action}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-700">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${(count / logs.length) * 100}%` }} />
                    </div>
                    <span className="text-sm text-zinc-400">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
