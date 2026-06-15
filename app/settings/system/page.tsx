export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Server, Database, Activity, Clock } from "lucide-react";

export default async function SystemPage() {
  const [licenses, activations, teamMembers] = await Promise.all([
    prisma.license.findMany(),
    prisma.activation.findMany(),
    prisma.teamMember.findMany(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="System Administration" description="Platform health, backups, maintenance mode and environment." />

      <StatCardGrid columns={4}>
        <StatCard title="Total Licenses" value={licenses.length} icon={Database} color="blue" subtitle="Platform data" />
        <StatCard title="Active Devices" value={activations.length} icon={Activity} color="green" />
        <StatCard title="Team Members" value={teamMembers.length} icon={Server} color="purple" />
        <StatCard title="Uptime" value="99.9%" icon={Clock} color="green" subtitle="Platform status" />
      </StatCardGrid>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">Platform Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Node.js Version</p>
            <p className="mt-1 font-medium">{process.version}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Environment</p>
            <p className="mt-1 font-medium">{process.env.NODE_ENV || "development"}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Database</p>
            <p className="mt-1 font-medium">SQLite {process.env.DATABASE_URL?.includes("dev.db") ? "(dev)" : ""}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Next.js</p>
            <p className="mt-1 font-medium">16.2.9</p>
          </div>
        </div>
      </div>
    </div>
  );
}
