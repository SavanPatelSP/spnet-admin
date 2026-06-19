import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Active Sessions" };

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { SessionsTable } from "@/components/sessions/SessionsTable";
import { Clock, Activity, Users, AlertTriangle } from "lucide-react";

export default async function SessionsPage() {
  const [sessions, expiredCount] = await Promise.all([
    prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        teamMember: { select: { name: true, email: true } },
      },
    }),
    prisma.session.count({
      where: { expiresAt: { lt: new Date() } },
    }),
  ]);

  const activeSessions = sessions.filter((s) => s.expiresAt > new Date());
  const uniqueUsers = new Set(activeSessions.map((s) => s.teamMemberId)).size;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Session Management"
        description="Monitor and manage all active user sessions across the platform."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Active Sessions" value={activeSessions.length} icon={Activity} color="green" />
        <StatCard title="Active Users" value={uniqueUsers} icon={Users} color="blue" />
        <StatCard title="Expired Sessions" value={expiredCount} icon={Clock} color="yellow" />
        <StatCard title="Total Sessions" value={sessions.length} icon={AlertTriangle} color="purple" />
      </StatCardGrid>

      <SessionsTable sessions={sessions} />
    </div>
  );
}
