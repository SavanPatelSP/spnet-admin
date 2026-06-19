"use client";

import Link from "next/link";
import { Shield, AlertTriangle, CheckCircle, Lock, Users, Activity, Ban, LogIn, Fingerprint, Server, ArrowUpRight } from "lucide-react";

interface StatCardItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  href?: string;
}

function StatCardInline({ item }: { item: StatCardItem }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  const inner = (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-800/50">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorMap[item.color]}`}>
        {item.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-zinc-100">{item.value}</p>
        <p className="truncate text-xs text-zinc-500">{item.label}</p>
      </div>
      <ArrowUpRight size={14} className="shrink-0 text-zinc-600" />
    </div>
  );

  if (item.href) {
    return <Link href={item.href}>{inner}</Link>;
  }

  return inner;
}

export function SecurityOverviewCards({
  policies, auditLogs, mfaEnabledCount, totalUsers, failedLogins, activeSessions,
}: {
  policies: { enabled: boolean; severity: string }[];
  auditLogs: { action: string }[];
  mfaEnabledCount: number;
  totalUsers: number;
  failedLogins: number;
  activeSessions: number;
}) {
  const highSeverity = policies.filter((p) => p.severity === "High").length;
  const securityEvents = auditLogs.filter((l) =>
    ["EMERGENCY_LOCKDOWN", "POLICY_TOGGLED", "SESSION_REVOKED", "DEVICE_BLACKLISTED"].includes(l.action)
  ).length;

  const items: StatCardItem[] = [
    { label: "High Severity Policies", value: highSeverity, icon: <AlertTriangle size={16} />, color: "yellow", href: "/settings/security?severity=high" },
    { label: "MFA Adoption", value: `${totalUsers > 0 ? Math.round((mfaEnabledCount / totalUsers) * 100) : 0}%`, icon: <Lock size={16} />, color: "green", href: "/settings/team-members?mfa=true" },
    { label: "Failed Logins", value: failedLogins, icon: <Ban size={16} />, color: "red", href: "/audit-logs?type=login&status=failed" },
    { label: "Active Sessions", value: activeSessions, icon: <Users size={16} />, color: "purple", href: "/sessions" },
    { label: "Security Events", value: securityEvents, icon: <Activity size={16} />, color: "blue", href: "/audit-logs" },
    { label: "Total Users", value: totalUsers, icon: <Server size={16} />, color: "blue", href: "/settings/team-members" },
  ];

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-zinc-100">Security Overview</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <StatCardInline key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
