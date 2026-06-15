export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Megaphone, Users, Send, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function BroadcastsPage() {
  const teamMembers = await prisma.teamMember.findMany();
  const licenses = await prisma.license.findMany();

  return (
    <div className="space-y-8">
      <PageHeader title="Broadcasts" description="Send announcements and notifications to users." />

      <StatCardGrid columns={4}>
        <StatCard title="Team Members" value={teamMembers.length} icon={Users} color="blue" subtitle="Recipients" />
        <StatCard title="Licenses" value={licenses.length} icon={Send} color="green" subtitle="Organizations" />
        <StatCard title="Pending" value={0} icon={Clock} color="yellow" subtitle="Drafts" />
        <StatCard title="Sent (30d)" value={0} icon={Megaphone} color="purple" subtitle="Last 30 days" />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">Create Broadcast</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Subject"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
          <textarea
            rows={6}
            placeholder="Message content..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
          <div className="flex items-center gap-4">
            <button className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-500">
              Send Broadcast
            </button>
            <button className="rounded-xl bg-zinc-800 px-5 py-3 font-medium text-zinc-200 transition-colors hover:bg-zinc-700">
              Save as Draft
            </button>
          </div>
        </div>
      </div>

      <EmptyState
        title="No sent broadcasts"
        description="Previous broadcasts will appear here."
      />
    </div>
  );
}
