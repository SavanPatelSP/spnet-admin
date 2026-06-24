import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Approvals" };

import { requireAuth, hasPermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getApprovalStats, getApprovalRequests } from "@/lib/approval";
import { formatDateTime } from "@/lib/shared";
import { CheckCircle2, XCircle, Clock, Inbox, User } from "lucide-react";
import ApprovalActions from "@/components/approvals/ApprovalActions";
import Link from "next/link";
import { redirect } from "next/navigation";

const workflowLabels: Record<string, string> = {
  LICENSE_CREATE: "Create License", LICENSE_BULK: "Bulk Create", LICENSE_TRANSFER: "Transfer License",
  REGENERATE_KEY: "Regenerate Key",
  PREMIUM_GRANT: "Grant Premium", PREMIUM_EXTEND: "Extend Premium",
  PREMIUM_CHANGE_PLAN: "Change Plan", PREMIUM_DOWNGRADE: "Downgrade",
  PREMIUM_CONVERT_LIFETIME: "Convert Lifetime", PREMIUM_CONVERT_CUSTOM: "Convert Custom",
  COINS_GRANT: "Grant Coins", COINS_REMOVE: "Remove Coins", COINS_SET: "Set Coins",
  GEMS_GRANT: "Grant Gems", GEMS_REVOKE: "Revoke Gems", GEMS_SET: "Set Gems",
  TEAM_CREATE: "Create Member", TEAM_UPDATE: "Update Member",
  TEAM_CHANGE_ROLE: "Change Role", TRANSFER_OWNERSHIP: "Transfer Ownership",
};

const workflowCategories: { label: string; value: string; types: string[] }[] = [
  { label: "All", value: "", types: [] },
  { label: "Licensing", value: "LICENSING", types: ["LICENSE_CREATE", "LICENSE_BULK", "LICENSE_TRANSFER", "REGENERATE_KEY"] },
  { label: "Premium", value: "PREMIUM", types: ["PREMIUM_GRANT", "PREMIUM_EXTEND", "PREMIUM_CHANGE_PLAN", "PREMIUM_DOWNGRADE", "PREMIUM_CONVERT_LIFETIME", "PREMIUM_CONVERT_CUSTOM"] },
  { label: "Economy", value: "ECONOMY", types: ["COINS_GRANT", "COINS_REMOVE", "COINS_SET", "GEMS_GRANT", "GEMS_REVOKE", "GEMS_SET"] },
  { label: "Team", value: "TEAM", types: ["TEAM_CREATE", "TEAM_UPDATE", "TEAM_CHANGE_ROLE", "TRANSFER_OWNERSHIP"] },
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
  searchParams: Promise<{ type?: string; tab?: string }>;
}) {
  const session = await requireAuth();
  const isApprover = ["OWNER", "SUPER_ADMIN"].includes(session.user.role) || hasPermission(session, "Approve Requests");
  if (!isApprover && session.user.role !== "OWNER") {
    redirect("/unauthorized");
  }
  const { type, tab } = await searchParams;
  const activeCategory = workflowCategories.find((c) => c.value === type);
  const workflowFilter = activeCategory?.types.length ? activeCategory.types : undefined;
  const showMyRequests = tab === "my" && !isApprover;

  const [stats, pendingResult, historyResult, myResult] = await Promise.all([
    getApprovalStats(),
    isApprover ? getApprovalRequests({ status: "PENDING", limit: 50, workflowType: workflowFilter }) : Promise.resolve({ requests: [], total: 0 }),
    isApprover ? getApprovalRequests({ limit: 50, workflowType: workflowFilter }) : Promise.resolve({ requests: [], total: 0 }),
    showMyRequests || !isApprover ? getApprovalRequests({ requesterId: session.user.id, limit: 50 }) : Promise.resolve({ requests: [], total: 0 }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approval Requests"
        description="Review and manage pending approvals for licensing, premium, economy, and team actions."
      />

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
        <div className="ml-auto">
          <Link
            href={showMyRequests ? "/approvals" : "/approvals?tab=my"}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showMyRequests ? "bg-emerald-600/15 text-emerald-400" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
          >
            <User size={12} />
            My Requests
          </Link>
        </div>
      </div>

      {isApprover && (
        <StatCardGrid columns={4}>
          <StatCard title="Pending" value={stats.pending} icon={Clock} color={stats.pending > 0 ? "yellow" : "green"} />
          <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} color="green" />
          <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
          <StatCard title="Total" value={stats.pending + stats.approved + stats.rejected} icon={Inbox} color="blue" />
        </StatCardGrid>
      )}

      {(showMyRequests || !isApprover) && myResult.requests.length > 0 && (
        <Card title="My Requests" description="Requests you have submitted">
          <DataTable
            columns={[
              { key: "workflow", label: "Type", sortable: true },
              { key: "title", label: "Title", sortable: true, searchable: true },
              { key: "status", label: "Status", sortable: true },
              { key: "priority", label: "Priority", sortable: true },
              { key: "submittedAt", label: "Submitted", sortable: true },
              { key: "reviewedAt", label: "Reviewed", sortable: true },
            ]}
            rows={myResult.requests.map((req) => ({
              id: req.id,
              values: {
                workflow: workflowLabels[req.workflowType] || req.workflowType,
                title: req.title,
                status: req.status,
                priority: req.priority,
                submittedAt: req.submittedAt.toISOString(),
                reviewedAt: req.reviewedAt?.toISOString() || "",
              },
              cells: [
                <Link key="wf" href={`/approvals/${req.id}`} className="text-xs font-medium text-blue-400 hover:text-blue-300">{workflowLabels[req.workflowType] || req.workflowType}</Link>,
                <Link key="title" href={`/approvals/${req.id}`} className="text-sm text-zinc-200 hover:text-zinc-100">{req.title}</Link>,
                <span key="st"><StatusBadge status={req.status} /></span>,
                <span key="pri" className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityColors[req.priority] || priorityColors.MEDIUM}`}>{req.priority}</span>,
                <span key="dt" className="text-xs text-zinc-500">{formatDateTime(req.submittedAt)}</span>,
                <span key="rv" className="text-xs text-zinc-500">{req.reviewedAt ? formatDateTime(req.reviewedAt) : "-"}</span>,
              ],
            }))}
            pageSize={15}
            emptyMessage="No requests yet."
            searchPlaceholder="Search my requests..."
          />
        </Card>
      )}

      {(showMyRequests || !isApprover) && myResult.requests.length === 0 && (
        <Card title="My Requests" description="Requests you have submitted">
          <p className="py-8 text-center text-sm text-zinc-500">You have not submitted any approval requests yet.</p>
        </Card>
      )}

      {isApprover && (
        <>
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
                  <Link key="wf" href={`/approvals/${req.id}`} className="text-xs font-medium text-blue-400 hover:text-blue-300">{workflowLabels[req.workflowType] || req.workflowType}</Link>,
                  <Link key="title" href={`/approvals/${req.id}`} className="text-sm text-zinc-200 hover:text-zinc-100">{req.title}</Link>,
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
                  <Link key="wf" href={`/approvals/${req.id}`} className="text-xs font-medium text-blue-400 hover:text-blue-300">{workflowLabels[req.workflowType] || req.workflowType}</Link>,
                  <Link key="title" href={`/approvals/${req.id}`} className="text-sm text-zinc-200 hover:text-zinc-100">{req.title}</Link>,
                  <span key="st"><StatusBadge status={req.status} /></span>,
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
        </>
      )}
    </div>
  );
}
