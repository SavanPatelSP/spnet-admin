export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/shared";

export default async function ReportsPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  const reportActions = ["LICENSE_CREATED", "LICENSE_DELETED", "LICENSE_SUSPENDED", "EMERGENCY_LOCKDOWN", "DEVICE_REVOKED"];
  const reportItems = logs.filter((l) => reportActions.includes(l.action));

  return (
    <div className="space-y-8">
      <PageHeader title="Reports Center" description="View abuse, fraud, compliance and system reports." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Reports" value={reportItems.length} icon={FileText} color="blue" subtitle="All time" />
        <StatCard title="Critical" value={reportItems.filter((r) => r.action === "EMERGENCY_LOCKDOWN").length} icon={AlertTriangle} color="red" />
        <StatCard title="Resolved" value={reportItems.length} icon={CheckCircle} color="green" />
        <StatCard title="Pending Review" value={0} icon={Clock} color="yellow" />
      </StatCardGrid>

      <DataTable
        columns={[
          {
            key: "action",
            label: "Type",
            sortable: true,
            render: (r: Record<string, unknown>) => <StatusBadge status={(r.action as string)?.replace(/_/g, " ")} />,
          },
          {
            key: "description",
            label: "Description",
            sortable: true,
            searchable: true,
            render: (r: Record<string, unknown>) => <span className="text-sm">{r.description as string || "-"}</span>,
          },
          {
            key: "organization",
            label: "Organization",
            sortable: true,
            searchable: true,
            render: (r: Record<string, unknown>) => (r.organization as string) || "-",
          },
          {
            key: "actorName",
            label: "Filed By",
            sortable: true,
            render: (r: Record<string, unknown>) => (r.actorName as string) || "-",
          },
          {
            key: "createdAt",
            label: "Date",
            sortable: true,
            render: (r: Record<string, unknown>) => formatDate(r.createdAt as Date),
          },
        ]}
        data={reportItems as unknown as Record<string, unknown>[]}
        keyExtractor={(r) => r.id as string}
        emptyMessage="No reports found. System reports will appear here."
        searchPlaceholder="Search reports..."
      />
    </div>
  );
}
