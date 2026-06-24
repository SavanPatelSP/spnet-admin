import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Active Sessions" };

import { prisma } from "@/lib/prisma";
import { requirePermission, getAuthSession } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { SessionsTable } from "@/components/sessions/SessionsTable";
import { getAggregatedFingerprintStats } from "@/lib/security/fingerprint";
import { Clock, Activity, Users, AlertTriangle, Shield, Fingerprint, Globe } from "lucide-react";
import Link from "next/link";

export default async function SessionsPage() {
  await requirePermission("Manage Sessions");
  const authSession = await getAuthSession();
  const currentUserRole = authSession?.user.role || "";
  const [sessions, expiredCount] = await Promise.all([
    prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        teamMember: { select: { name: true, email: true, role: { select: { name: true } } } },
      },
    }),
    prisma.session.count({
      where: { expiresAt: { lt: new Date() } },
    }),
  ]);

  const activeSessions = sessions.filter((s) => s.expiresAt > new Date());
  const uniqueUsers = new Set(activeSessions.map((s) => s.teamMemberId)).size;
  const fingerprintStats = await getAggregatedFingerprintStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Session Management"
        description="Monitor and manage all active user sessions across the platform."
      />

      <StatCardGrid columns={5}>
        <StatCard title="Active Sessions" value={activeSessions.length} icon={Activity} color="green" />
        <StatCard title="Active Users" value={uniqueUsers} icon={Users} color="blue" />
        <StatCard title="Expired Sessions" value={expiredCount} icon={Clock} color="yellow" />
        <StatCard title="Total Sessions" value={sessions.length} icon={AlertTriangle} color="purple" />
        <Link href="/security-center" className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 transition-all duration-200 hover:border-zinc-700/50 hover:bg-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Suspicious</p>
              <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-red-400">{fingerprintStats.suspicious}</h3>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <Shield size={20} className="text-red-400" />
            </div>
          </div>
        </Link>
      </StatCardGrid>

      <Card title="Fingerprint Overview" className="overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-3 rounded-lg bg-zinc-800/30">
            <p className="text-2xl font-bold text-green-400">{fingerprintStats.riskDistribution.low}</p>
            <p className="text-xs text-zinc-500 mt-1">Low Risk</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-800/30">
            <p className="text-2xl font-bold text-yellow-400">{fingerprintStats.riskDistribution.medium}</p>
            <p className="text-xs text-zinc-500 mt-1">Medium Risk</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-800/30">
            <p className="text-2xl font-bold text-orange-400">{fingerprintStats.riskDistribution.high}</p>
            <p className="text-xs text-zinc-500 mt-1">High Risk</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-800/30">
            <p className="text-2xl font-bold text-red-400">{fingerprintStats.riskDistribution.critical}</p>
            <p className="text-xs text-zinc-500 mt-1">Critical Risk</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-zinc-800/30">
            <p className="text-2xl font-bold text-purple-400">{fingerprintStats.countries.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Countries</p>
          </div>
        </div>
      </Card>

      <SessionsTable sessions={sessions} currentUserRole={currentUserRole} />
    </div>
  );
}
