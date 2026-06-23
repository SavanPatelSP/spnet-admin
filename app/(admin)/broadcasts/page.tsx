import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Broadcasts" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Megaphone, Send, Clock, FileEdit } from "lucide-react";
import { CreateBroadcastForm } from "./CreateBroadcastForm";
import { BroadcastHistory } from "@/components/broadcast/BroadcastHistory";

export default async function BroadcastsPage() {
  await requirePermission("View Broadcasts");
  const broadcasts = await prisma.broadcast.findMany({ orderBy: { createdAt: "desc" } });

  const drafts = broadcasts.filter((b) => b.status === "DRAFT").length;
  const scheduled = broadcasts.filter((b) => b.status === "SCHEDULED").length;
  const sent30d = broadcasts.filter(
    (b) => b.status === "SENT" && b.sentAt && b.sentAt > new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
  ).length;
  const totalSent = broadcasts.filter((b) => b.status === "SENT").length;

  const historyItems = broadcasts.map((b) => ({
    id: b.id,
    subject: b.subject,
    type: b.type,
    audience: b.audience,
    status: b.status,
    sentCount: b.sentCount,
    targetCount: b.targetCount,
    failedCount: b.failedCount,
    createdAt: b.createdAt.toISOString(),
    sentAt: b.sentAt?.toISOString() || null,
  }));

  return (
    <div className="space-y-8">
      <PageHeader title="Broadcasts" description="Send announcements and notifications to users." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Sent" value={totalSent} icon={Send} color="green" subtitle="All time" />
        <StatCard title="Sent (30d)" value={sent30d} icon={Megaphone} color="blue" subtitle="Last 30 days" />
        <StatCard title="Scheduled" value={scheduled} icon={Clock} color="yellow" subtitle="Pending delivery" />
        <StatCard title="Drafts" value={drafts} icon={FileEdit} color="purple" subtitle="Not yet sent" />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">Create Broadcast</h2>
        <CreateBroadcastForm />
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Broadcast History</h2>
          <span className="text-sm text-zinc-500">{broadcasts.length} total</span>
        </div>
        {historyItems.length === 0 ? (
          <EmptyState
            title="No broadcasts yet"
            description="Create your first broadcast above."
          />
        ) : (
          <BroadcastHistory broadcasts={historyItems} />
        )}
      </div>
    </div>
  );
}
