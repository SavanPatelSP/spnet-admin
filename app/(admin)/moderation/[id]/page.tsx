export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/shared";
import { ResolveReportForm } from "./ResolveReportForm";

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-500/10",
  INVESTIGATING: "text-blue-400 bg-blue-500/10",
  RESOLVED: "text-green-400 bg-green-500/10",
  DISMISSED: "text-zinc-400 bg-zinc-500/10",
};

type TargetType = "LICENSE" | "USER" | "TEAM_MEMBER";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("Moderate Content");
  const { id } = await params;

  const report = await prisma.moderationReport.findUnique({ where: { id } });
  if (!report) notFound();

  let targetContext: { name: string; status: string; link?: string } | null = null;

  if (report.targetType === "LICENSE") {
    const license = await prisma.license.findUnique({ where: { id: report.targetId } });
    if (license) {
      targetContext = { name: license.key, status: license.status, link: `/licenses/${license.id}` };
    }
  } else if (report.targetType === "TEAM_MEMBER") {
    const member = await prisma.teamMember.findUnique({ where: { id: report.targetId } });
    if (member) {
      targetContext = { name: member.email, status: member.status };
    }
  }

  const previousActions = report.actionTaken
    ? await prisma.moderationAction.findMany({
        where: { targetId: report.targetId, targetType: report.targetType as TargetType },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  return (
    <div className="space-y-8">
      <PageHeader title="Moderation Report" description={`Report ${id.slice(0, 8)}...`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-bold">Report Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-500 mb-1">Reason</p>
                <p className="text-zinc-300">{report.reason}</p>
              </div>
              {report.description && (
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Description</p>
                  <p className="whitespace-pre-wrap text-zinc-400">{report.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-zinc-500 mb-1">Reporter</p>
                <p className="text-zinc-300">{report.reporterId || "System"}</p>
              </div>
            </div>
          </div>

          {targetContext && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-bold">Target Preview</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Type</span>
                  <span className="text-zinc-300">{report.targetType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">ID</span>
                  <span className="text-zinc-300">{report.targetId.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Name</span>
                  {targetContext.link ? (
                    <a href={targetContext.link} className="text-blue-400 hover:underline">{targetContext.name}</a>
                  ) : (
                    <span className="text-zinc-300">{targetContext.name}</span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Status</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    targetContext.status === "ACTIVE" ? "bg-green-500/10 text-green-400" :
                    targetContext.status === "SUSPENDED" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>{targetContext.status}</span>
                </div>
              </div>
            </div>
          )}

          {previousActions.length > 0 && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-bold">Previous Actions on this Target</h2>
              <div className="space-y-2">
                {previousActions.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        a.actionType === "SUSPENSION" || a.actionType === "BAN" ? "bg-red-500/10 text-red-400" :
                        a.actionType === "WARNING" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-green-500/10 text-green-400"
                      }`}>{a.actionType}</span>
                      <span className="truncate text-sm text-zinc-400">{a.reason}</span>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-600">{formatDate(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.status === "PENDING" || report.status === "INVESTIGATING" ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-bold">Take Action</h2>
              <ResolveReportForm
                reportId={report.id}
                targetType={report.targetType}
                targetId={report.targetId}
              />
            </div>
          ) : (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-bold">Resolution</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Status</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[report.status] || ""}`}>{report.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Action Taken</span>
                  <span className="text-zinc-300">{report.actionTaken || "None"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Resolved By</span>
                  <span className="text-zinc-300">{report.resolvedBy || "-"}</span>
                </div>
                {report.resolvedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Resolved At</span>
                    <span className="text-zinc-300">{formatDate(report.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 font-semibold">Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Target Type</span>
                <span className="text-zinc-300">{report.targetType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Target ID</span>
                <span className="text-xs text-zinc-400">{report.targetId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Status</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[report.status] || ""}`}>{report.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Created</span>
                <span className="text-zinc-300">{formatDate(report.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
