import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Approvals" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getApprovalStats, getApprovalRequests } from "@/lib/approval";
import { formatDateTime } from "@/lib/shared";
import { CheckCircle2, XCircle, Clock, Inbox } from "lucide-react";
import ApprovalActions from "@/components/approvals/ApprovalActions";
import Link from "next/link";
import { redirect } from "next/navigation";

const workflowLabels: Record<string, string> = {
  PREMIUM_GRANT: "Premium Grant",
  PREMIUM_EXTEND: "Premium Extend",
  PREMIUM_REVOKE: "Premium Revoke",
  PREMIUM_PLAN_CHANGE: "Plan Change",
  PREMIUM_LIFETIME_CONVERT: "Lifetime Convert",
  PREMIUM_CUSTOM_CONVERT: "Custom Convert",
  COINS_GRANT: "Grant Coins",
  COINS_REMOVE: "Remove Coins",
  COINS_SET: "Set Coins",
  GEMS_GRANT: "Grant Gems",
  GEMS_REMOVE: "Remove Gems",
  GEMS_SET: "Set Gems",
  LICENSE_CREATE: "Create License",
  LICENSE_DELETE: "Delete License",
  LICENSE_TRANSFER: "Transfer License",
  LICENSE_BULK: "Bulk Operation",
  USER_BAN: "Ban User",
  USER_SUSPEND: "Suspend User",
  USER_DELETE: "Delete User",
  USER_VERIFICATION: "Verification Change",
  ROLE_CREATE: "Create Role",
  ROLE_DELETE: "Delete Role",
  ROLE_PERMISSION_CHANGE: "Permission Change",
  TEAM_CREATE: "Create Team Member",
  TEAM_EDIT: "Edit Team Member",
  TEAM_DELETE: "Delete Team Member",
  TEAM_ROLE_CHANGE: "Change Role",
  OWNERSHIP_TRANSFER: "Ownership Transfer",
  ORG_CREATE: "Create Organization",
  ORG_EDIT: "Edit Organization",
  ORG_DELETE: "Delete Organization",
};

const workflowCategories: { label: string; value: string; types: string[] }[] = [
  { label: "All", value: "", types: [] },
  { label: "Premium", value: "PREMIUM", types: ["PREMIUM_GRANT", "PREMIUM_EXTEND", "PREMIUM_REVOKE", "PREMIUM_PLAN_CHANGE", "PREMIUM_LIFETIME_CONVERT", "PREMIUM_CUSTOM_CONVERT"] },
  { label: "Economy", value: "ECONOMY", types: ["COINS_GRANT", "COINS_REMOVE", "COINS_SET", "GEMS_GRANT", "GEMS_REMOVE", "GEMS_SET"] },
  { label: "Licensing", value: "LICENSING", types: ["LICENSE_CREATE", "LICENSE_DELETE", "LICENSE_TRANSFER", "LICENSE_BULK"] },
  { label: "Users", value: "USERS", types: ["USER_BAN", "USER_SUSPEND", "USER_DELETE", "USER_VERIFICATION"] },
  { label: "Roles", value: "ROLES", types: ["ROLE_CREATE", "ROLE_DELETE", "ROLE_PERMISSION_CHANGE"] },
  { label: "Team", value: "TEAM", types: ["TEAM_CREATE", "TEAM_EDIT", "TEAM_DELETE", "TEAM_ROLE_CHANGE", "OWNERSHIP_TRANSFER"] },
  { label: "Organizations", value: "ORGS", types: ["ORG_CREATE", "ORG_EDIT", "ORG_DELETE"] },
];

const priorityColors: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-400",
  MEDIUM: "bg-yellow-500/10 text-yellow-400",
  HIGH: "bg-orange-500/10 text-orange-400",
  CRITICAL: "bg-red-500/10 text-red-400",
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await requirePermission("Approve Requests");
  if (session.user.role !== "OWNER" && session.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized");
  }
  const { type } = await searchParams;
  const activeCategory = workflowCategories.find((c) => c.value === type);

  const workflowFilter = activeCategory?.types.length ? activeCategory.types : undefined;

  const [stats, pendingResult, historyResult] = await Promise.all([
    getApprovalStats(),
    getApprovalRequests({ status: "PENDING", limit: 50, workflowType: workflowFilter }),
    getApprovalRequests({ limit: 50, workflowType: workflowFilter }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approval Requests"
        description="Review and manage pending approvals for premium, economy, licensing, users, roles, team members, and organizations."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Pending" value={stats.pending} icon={Clock} color={stats.pending > 0 ? "yellow" : "green"} />
        <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} color="green" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
        <StatCard title="Total" value={stats.pending + stats.approved + stats.rejected} icon={Inbox} color="blue" />
      </StatCardGrid>

      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {workflowCategories.map((cat) => {
          const href = cat.value ? `/approvals?type=${cat.value}` : "/approvals";
          const isActive = type === cat.value || (!type && !cat.value);
          return (
            <Link
              key={cat.value}
              href={href}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/15 text-blue-400"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      <Card title="Pending Approvals" description="Requests awaiting your review">
        <DataTable
          columns={[
            { key: "workflow", label: "Type", sortable: true },
            { key: "title", label: "Title", sortable: true, searchable: true },
            { key: "requester", label: "Requester", sortable: true, searchable: true },
            { key: "priority", label: "Priority", sortable: true },
            { key: "reason", label: "Reason", searchable: true },
            { key: "submittedAt", label: "Submitted", sortable: true },
            { key: "actions", label: "Actions" },
          ]}
          rows={pendingResult.requests.map((req) => ({
            id: req.id,
            values: {
              workflow: workflowLabels[req.workflowType] || req.workflowType,
              title: req.title,
              requester: req.requesterName || req.requesterEmail || "Unknown",
              priority: req.priority,
              reason: req.reason || "",
              submittedAt: req.submittedAt.toISOString(),
              actions: "",
            },
            cells: [
              <span key="wf" className="text-xs font-medium text-zinc-300">{workflowLabels[req.workflowType] || req.workflowType}</span>,
              <span key="title" className="text-sm text-zinc-200">{req.title}</span>,
              <span key="req" className="text-sm text-zinc-400">{req.requesterName || req.requesterEmail || "-"}</span>,
              <span key="pri" className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityColors[req.priority] || priorityColors.MEDIUM}`}>{req.priority}</span>,
              <span key="reason" className="text-sm text-zinc-500 truncate max-w-[200px]">{req.reason || "-"}</span>,
              <span key="date" className="text-xs text-zinc-500">{formatDateTime(req.submittedAt)}</span>,
              <span key="actions"><ApprovalActions requestId={req.id} title={req.title} /></span>,
            ],
          }))}
          pageSize={15}
          emptyMessage="No pending approvals."
          searchPlaceholder="Search approvals..."
        />
      </Card>

      <Card title="Approval History" description="Recent approval activity">
        <DataTable
          columns={[
            { key: "workflow", label: "Type", sortable: true },
            { key: "title", label: "Title", sortable: true, searchable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "requester", label: "Requester", sortable: true },
            { key: "approver", label: "Approver", sortable: true },
            { key: "reviewedAt", label: "Reviewed", sortable: true },
          ]}
          rows={historyResult.requests.filter(r => r.status !== "PENDING").map((req) => ({
            id: req.id,
            values: {
              workflow: workflowLabels[req.workflowType] || req.workflowType,
              title: req.title,
              status: req.status,
              requester: req.requesterName || req.requesterEmail || "Unknown",
              approver: req.approverName || req.approverEmail || "-",
              reviewedAt: req.reviewedAt?.toISOString() || "",
            },
            cells: [
              <span key="wf" className="text-xs font-medium text-zinc-300">{workflowLabels[req.workflowType] || req.workflowType}</span>,
              <span key="title" className="text-sm text-zinc-200">{req.title}</span>,
              <span key="status"><StatusBadge status={req.status} /></span>,
              <span key="req" className="text-sm text-zinc-400">{req.requesterName || req.requesterEmail || "-"}</span>,
              <span key="app" className="text-sm text-zinc-400">{req.approverName || req.approverEmail || "-"}</span>,
              <span key="date" className="text-xs text-zinc-500">{req.reviewedAt ? formatDateTime(req.reviewedAt) : "-"}</span>,
            ],
          }))}
          pageSize={15}
          emptyMessage="No approval history yet."
          searchPlaceholder="Search history..."
        />
      </Card>
    </div>
  );
}
