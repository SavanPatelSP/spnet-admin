import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireAuth, hasPermission } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/shared";
import ApprovalActions from "@/components/approvals/ApprovalActions";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Approval #${id.slice(0, 8)}` };
}

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

const priorityColors: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-400",
  MEDIUM: "bg-yellow-500/10 text-yellow-400",
  HIGH: "bg-orange-500/10 text-orange-400",
  CRITICAL: "bg-red-500/10 text-red-400",
};

function renderMetadata(workflowType: string, metadata: Record<string, unknown>) {
  switch (workflowType) {
    case "LICENSE_CREATE":
    case "LICENSE_BULK":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Organization" value={metadata.organization as string} />
          <DetailItem label="Plan" value={metadata.plan as string} />
          <DetailItem label="Max Devices" value={String(metadata.maxDevices ?? "")} />
          <DetailItem label="Status" value={metadata.status as string} />
          <DetailItem label="Expires At" value={metadata.expiresAt ? String(metadata.expiresAt) : "No expiry"} />
          <DetailItem label="Notes" value={metadata.notes as string || "-"} />
        </div>
      );
    case "LICENSE_TRANSFER":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="License ID" value={metadata.licenseId as string} />
          <DetailItem label="New Organization" value={metadata.newOrganization as string} />
        </div>
      );
    case "REGENERATE_KEY":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="License ID" value={metadata.id as string} />
          <DetailItem label="Reason" value={metadata.reason as string || "-"} />
        </div>
      );
    case "PREMIUM_GRANT":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="License ID" value={metadata.licenseId as string} />
          <DetailItem label="Plan" value={metadata.plan as string} />
          <DetailItem label="Duration" value={metadata.durationDays ? `${metadata.durationDays} days` : "Lifetime"} />
          <DetailItem label="Subscription Type" value={metadata.subscriptionType as string || "MONTHLY"} />
        </div>
      );
    case "PREMIUM_EXTEND":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="License ID" value={metadata.licenseId as string} />
          <DetailItem label="Additional Days" value={String(metadata.additionalDays ?? "")} />
        </div>
      );
    case "PREMIUM_CHANGE_PLAN":
    case "PREMIUM_DOWNGRADE":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="License ID" value={metadata.licenseId as string} />
          <DetailItem label="New Plan" value={metadata.newPlan as string} />
          <DetailItem label="Subscription Type" value={metadata.newSubscriptionType as string || "-"} />
        </div>
      );
    case "PREMIUM_CONVERT_LIFETIME":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="License ID" value={metadata.licenseId as string} />
          <DetailItem label="Conversion" value="To Lifetime" />
        </div>
      );
    case "PREMIUM_CONVERT_CUSTOM":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="License ID" value={metadata.licenseId as string} />
          <DetailItem label="Plan" value={metadata.plan as string} />
          <DetailItem label="Duration Days" value={String(metadata.durationDays ?? "")} />
        </div>
      );
    case "COINS_GRANT":
    case "COINS_REMOVE":
    case "COINS_SET":
    case "GEMS_GRANT":
    case "GEMS_REVOKE":
    case "GEMS_SET":
      const coinLabel = workflowType.startsWith("GEM") ? "Gems" : "Coins";
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="License ID" value={metadata.licenseId as string} />
          <DetailItem label="Amount" value={metadata.amount ? String(metadata.amount) : metadata.balance ? String(metadata.balance) : "-"} />
          <DetailItem label="Reason" value={metadata.reason as string || "-"} />
          <DetailItem label="Type" value={metadata.type as string || "-"} />
        </div>
      );
    case "TEAM_CREATE":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Name" value={metadata.name as string} />
          <DetailItem label="Email" value={metadata.email as string} />
          <DetailItem label="Role ID" value={metadata.roleId as string} />
        </div>
      );
    case "TEAM_UPDATE":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Member ID" value={metadata.id as string} />
          <DetailItem label="Name" value={metadata.name as string || "-"} />
          <DetailItem label="Email" value={metadata.email as string || "-"} />
          <DetailItem label="Role ID" value={metadata.roleId as string || "-"} />
        </div>
      );
    case "TEAM_CHANGE_ROLE":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Member ID" value={metadata.id as string} />
          <DetailItem label="New Role ID" value={metadata.roleId as string} />
        </div>
      );
    case "TRANSFER_OWNERSHIP":
      return (
        <div className="grid grid-cols-2 gap-3">
          <DetailItem label="Target Member ID" value={metadata.targetMemberId as string} />
        </div>
      );
    default:
      return (
        <pre className="text-xs text-zinc-400 font-mono">{JSON.stringify(metadata, null, 2)}</pre>
      );
  }
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <p className="mt-0.5 text-sm font-medium text-zinc-200 break-all">{value || <span className="text-zinc-600">-</span>}</p>
    </div>
  );
}

export default async function ApprovalDetailPage({ params }: Props) {
  const session = await requireAuth();
  const { id } = await params;

  const request = await prisma.approvalRequest.findUnique({ where: { id } });
  if (!request) notFound();

  const isRequester = request.requesterId === session.user.id;
  const isApprover = ["OWNER", "SUPER_ADMIN"].includes(session.user.role) || hasPermission(session, "Approve Requests");
  if (!isRequester && !isApprover) redirect("/unauthorized");

  let parsedMetadata: Record<string, unknown> = {};
  try {
    if (request.metadata) parsedMetadata = JSON.parse(request.metadata);
  } catch {}

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-1">
          <PageHeader
            title={`${request.title}`}
            description={`${workflowLabels[request.workflowType] || request.workflowType} · Submitted ${formatDateTime(request.submittedAt)}`}
          />
        </div>
        <div className="shrink-0 pt-2">
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Request Details" description="General information about this request">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <DetailItem label="Request ID" value={request.id} />
              <DetailItem label="Workflow Type" value={workflowLabels[request.workflowType] || request.workflowType} />
              <DetailItem label="Status" value={request.status} />
              <DetailItem label="Priority" value={request.priority} />
              <DetailItem label="Submitted" value={formatDateTime(request.submittedAt)} />
              <DetailItem label="Reviewed" value={request.reviewedAt ? formatDateTime(request.reviewedAt) : "-"} />
            </div>
            {request.reason && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Reason</span>
                <p className="mt-1 text-sm text-zinc-300">{request.reason}</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Requester" description="Who submitted this request">
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="Name" value={request.requesterName || "-"} />
            <DetailItem label="Email" value={request.requesterEmail || "-"} />
            <DetailItem label="Requester ID" value={request.requesterId} />
          </div>
        </Card>
      </div>

      <Card title="Action Details" description="What will be executed if approved">
        {renderMetadata(request.workflowType, parsedMetadata)}
      </Card>

      {request.status !== "PENDING" && (
        <Card title="Review Information" description="Details about the decision">
          <div className="grid grid-cols-2 gap-3">
            {request.approverId && <DetailItem label="Approver ID" value={request.approverId} />}
            {request.approverName && <DetailItem label="Approver Name" value={request.approverName} />}
            {request.approverEmail && <DetailItem label="Approver Email" value={request.approverEmail} />}
            {request.reviewedAt && <DetailItem label="Reviewed At" value={formatDateTime(request.reviewedAt)} />}
            {request.executedAt && <DetailItem label="Executed At" value={formatDateTime(request.executedAt)} />}
            {request.approvalNote && (
              <div className="col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Note</span>
                <p className="mt-1 text-sm text-zinc-300">{request.approvalNote}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {request.status === "PENDING" && isApprover && (
        <div className="flex items-center gap-3 border-t border-zinc-800 pt-6">
          <ApprovalActions requestId={request.id} title={request.title} />
        </div>
      )}
    </div>
  );
}
