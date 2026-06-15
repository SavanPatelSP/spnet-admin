export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/shared";

export default async function ContentPage() {
  const auditLogs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  const contentActions = ["LICENSE_CREATED", "LICENSE_UPDATED", "LICENSE_KEY_REGENERATED"];
  const contentItems = auditLogs.filter((l) => contentActions.includes(l.action));

  return (
    <div className="space-y-8">
      <PageHeader title="Content Moderation" description="Review and manage platform content and moderation queue." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Items" value={contentItems.length} icon={FileText} color="blue" />
        <StatCard title="Flagged" value={0} icon={AlertTriangle} color="red" subtitle="Awaiting review" />
        <StatCard title="Approved" value={contentItems.length} icon={CheckCircle} color="green" />
        <StatCard title="Pending" value={0} icon={Clock} color="yellow" />
      </StatCardGrid>

      <DataTable
        columns={[
          { key: "action", label: "Type", sortable: true },
          { key: "description", label: "Content", sortable: false, searchable: true },
          { key: "organization", label: "Organization", sortable: true, searchable: true },
          { key: "actorName", label: "Author", sortable: true },
          { key: "createdAt", label: "Date", sortable: true },
        ]}
        rows={contentItems.map((c) => ({
          id: c.id,
          values: {
            action: c.action,
            description: c.description || "",
            organization: c.organization || "",
            actorName: c.actorName || "",
            createdAt: c.createdAt.toISOString(),
          },
          cells: [
            <StatusBadge status={c.action.replace(/_/g, " ")} />,
            <span className="text-sm">{c.description || "-"}</span>,
            <>{c.organization || "-"}</>,
            <>{c.actorName || "-"}</>,
            <>{formatDateTime(c.createdAt)}</>,
          ],
        }))}
        emptyMessage="No content items found."
        searchPlaceholder="Search content..."
      />
    </div>
  );
}
