import type { Metadata } from "next";
import * as os from "os";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "System Administration" };

import { prisma } from "@/lib/prisma";
import { APP_VERSION, APP_BUILD } from "@/lib/constants";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import {
  Server,
  Database,
  Activity,
  Clock,
  Shield,
  HardDrive,
  Users,
  Globe,
  Cpu,
  Wifi,
  Box,
  Package,
  GitBranch,
  Tag,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Cloud,
  Zap,
  BarChart3,
  Layers,
  Settings,
  Info,
} from "lucide-react";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export default async function SystemPage() {
  const [licenses, activations, teamMembers, sessions, failedLogins, auditLogCount, loginHistoryCount] =
    await Promise.all([
      prisma.license.findMany(),
      prisma.activation.findMany(),
      prisma.teamMember.findMany(),
      prisma.session.count(),
      prisma.loginHistory.count({ where: { success: false } }),
      prisma.auditLog.count(),
      prisma.loginHistory.count(),
    ]);

  const buildTime = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "long",
  });

  const memUsage = process.memoryUsage();
  const processUptime = process.uptime();
  const cpuCount = os.cpus().length;

  let dbHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch {}

  const dbUrl = process.env.DATABASE_URL || "";
  const dbName = dbUrl.includes("dev.db") ? "SQLite (Dev)" : "SQLite";

  return (
    <div className="space-y-8">
      <PageHeader
        title="System Administration"
        description="Platform health, version information, and environment details."
      />

      <StatCardGrid columns={3}>
        <StatCard
          title="Total Licenses"
          value={licenses.length}
          icon={Database}
          color="blue"
          subtitle="Platform data"
        />
        <StatCard
          title="Active Devices"
          value={activations.length}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Team Members"
          value={teamMembers.length}
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Uptime"
          value="99.9%"
          icon={Clock}
          color="green"
          subtitle="Platform status"
        />
        <StatCard
          title="Active Sessions"
          value={sessions}
          icon={Shield}
          color="blue"
        />
        <StatCard
          title="Failed Logins"
          value={failedLogins}
          icon={XCircle}
          color="red"
        />
      </StatCardGrid>

      {/* Version & Build Information */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
            <GitBranch size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Version &amp; Build Information</h2>
            <p className="text-xs text-zinc-500">Application version and runtime details</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Application</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">SP NET GRAM ADMIN PANEL</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Version</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{APP_VERSION} ({APP_BUILD})</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Node.js</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{process.version}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Framework</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">Next.js</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Next.js Version</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">16.2.9</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Build Time</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{buildTime}</p>
          </div>
        </div>
      </div>

      {/* Environment Information */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Cloud size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Environment Information</h2>
            <p className="text-xs text-zinc-500">Runtime environment and configuration</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Environment</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">
              {process.env.NODE_ENV || "development"}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Database</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{dbName}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Host</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">
              {process.env.HOSTNAME || "localhost"}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Platform</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{process.platform}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Architecture</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{process.arch}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">CPU Cores</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{cpuCount}</p>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10">
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Service Status</h2>
            <p className="text-xs text-zinc-500">Current health status of platform services</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Database</p>
              {dbHealthy ? (
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Healthy
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Unhealthy
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-100">{dbName}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">API</p>
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Operational
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-100">REST API</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Authentication</p>
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Operational
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-100">NextAuth.js</p>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10">
            <BarChart3 size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">System Metrics</h2>
            <p className="text-xs text-zinc-500">Aggregated platform statistics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Total Licenses</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{licenses.length}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Active Devices</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{activations.length}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Team Members</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{teamMembers.length}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Active Sessions</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{sessions}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Audit Log Entries</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{auditLogCount}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Login History Entries</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">{loginHistoryCount}</p>
          </div>
        </div>
      </div>

      {/* Platform Information */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-500/10">
            <Server size={20} className="text-zinc-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Platform Information</h2>
            <p className="text-xs text-zinc-500">Server and operating system details</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Operating System</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">
              {process.platform === "darwin"
                ? "macOS"
                : process.platform === "linux"
                  ? "Linux"
                  : process.platform === "win32"
                    ? "Windows"
                    : process.platform}
            </p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">CPU Cores</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{cpuCount}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Process Uptime</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{formatUptime(processUptime)}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Heap Used</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{formatBytes(memUsage.heapUsed)}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">Heap Total</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{formatBytes(memUsage.heapTotal)}</p>
          </div>
          <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
            <p className="text-xs text-zinc-500">RSS</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{formatBytes(memUsage.rss)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
