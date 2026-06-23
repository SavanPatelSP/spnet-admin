import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Audit Logs" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { ClipboardList, Users, Building2, CalendarDays, ShieldAlert } from "lucide-react";
import { formatDateTime } from "@/lib/shared";

const severityColors: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-400 border-green-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
};

const actionCategories: Record<string, string> = {
  LICENSE_CREATED: "License",
  LICENSE_UPDATED: "License",
  LICENSE_DELETED: "License",
  LICENSE_SUSPENDED: "License",
  LICENSE_REACTIVATED: "License",
  LICENSE_KEY_REGENERATED: "License",
  LICENSE_FEATURE_FLAG_UPDATED: "License",
  LICENSE_TAG_ADDED: "License",
  LICENSE_TAG_REMOVED: "License",
  LICENSE_TEMPLATE_CREATED: "License",
  LICENSE_TEMPLATE_UPDATED: "License",
  LICENSE_TEMPLATE_DELETED: "License",
  LICENSE_BULK_CREATED: "License",
  LICENSE_TRANSFERRED: "License",
  LICENSE_TRIAL_STARTED: "License",
  LICENSE_TRIAL_CONVERTED: "License",
  LICENSE_VALIDATED: "License",
  LOGIN_SUCCESS: "Auth",
  LOGIN_FAILURE: "Auth",
  LOGOUT: "Auth",
  PERMISSION_DENIED: "Auth",
  PASSWORD_RESET: "Auth",
  PASSWORD_CHANGED: "Auth",
  MFA_ENABLED: "Auth",
  MFA_DISABLED: "Auth",
  PREMIUM_GRANTED: "Premium",
  PREMIUM_REVOKED: "Premium",
  PREMIUM_EXTENDED: "Premium",
  PREMIUM_PLAN_CHANGED: "Premium",
  PREMIUM_CANCELLED: "Premium",
  PREMIUM_LIFETIME_CONVERTED: "Premium",
  PREMIUM_BULK_GRANTED: "Premium",
  PREMIUM_DOWNGRADED: "Premium",
  PREMIUM_UPGRADED: "Premium",
  PREMIUM_CONVERTED_TO_CUSTOM: "Premium",
  PREMIUM_REQUEST_CREATED: "Premium",
  PREMIUM_REQUEST_APPROVED: "Premium",
  PREMIUM_REQUEST_REJECTED: "Premium",
  PREMIUM_REQUEST_MODIFIED: "Premium",
  PREMIUM_GRANTED_FROM_REQUEST: "Premium",
  COINS_ADDED: "Coins",
  COINS_REMOVED: "Coins",
  COINS_REFUNDED: "Coins",
  COINS_ADJUSTED: "Coins",
  COINS_SET: "Coins",
  COINS_INFINITE_SET: "Coins",
  COINS_INFINITE_REMOVED: "Coins",
  COINS_BULK_GRANTED: "Coins",
  GEMS_GRANTED: "Gems",
  GEMS_REVOKED: "Gems",
  GEMS_ADJUSTED: "Gems",
  GEMS_SET: "Gems",
  GEMS_INFINITE_SET: "Gems",
  GEMS_INFINITE_REMOVED: "Gems",
  ROLE_CREATED: "Role",
  ROLE_UPDATED: "Role",
  ROLE_DELETED: "Role",
  ROLE_PERMISSIONS_UPDATED: "Role",
  TEAM_MEMBER_CREATED: "Team",
  TEAM_MEMBER_UPDATED: "Team",
  TEAM_MEMBER_SUSPENDED: "Team",
  TEAM_MEMBER_REACTIVATED: "Team",
  TEAM_MEMBER_ROLE_CHANGED: "Team",
  TEAM_MEMBER_DELETED: "Team",
  BULK_INVITE_SENT: "Team",
  OWNERSHIP_TRANSFERRED: "Team",
  DEVICE_REVOKED: "Device",
  ACTIVATION_DELETED: "Device",
  DEVICE_TRUST_UPDATED: "Device",
  DEVICE_BLACKLISTED: "Device",
  DEVICE_WHITELISTED: "Device",
  DEVICE_FINGERPRINT_REGISTERED: "Device",
  POLICY_TOGGLED: "Security",
  EMERGENCY_LOCKDOWN: "Security",
  SESSION_REVOKED: "Security",
  BROADCAST_CREATED: "Broadcast",
  BROADCAST_UPDATED: "Broadcast",
  BROADCAST_DELETED: "Broadcast",
  BROADCAST_SENT: "Broadcast",
  TICKET_CREATED: "Support",
  TICKET_UPDATED: "Support",
  TICKET_ASSIGNED: "Support",
  TICKET_RESOLVED: "Support",
  TICKET_CLOSED: "Support",
  TICKET_NOTE_ADDED: "Support",
  MODERATION_REPORT_CREATED: "Moderation",
  MODERATION_REPORT_RESOLVED: "Moderation",
  MODERATION_ACTION_TAKEN: "Moderation",
  INVALID_LICENSE_KEY: "License",
  LICENSE_EXPIRED_DENIAL: "License",
  LICENSE_SUSPENDED_DENIAL: "License",
  USER_LIFECYCLE_ARCHIVED: "Team",
  USER_LIFECYCLE_RESTORED: "Team",
};

function getSeverity(action: string): string {
  const actionUpper = action.toUpperCase();
  if (actionUpper.includes("FAILURE") || actionUpper.includes("DENIAL") || actionUpper.includes("DENIED") || actionUpper.includes("SUSPENDED") || actionUpper.includes("REVOKED") || actionUpper.includes("BLACKLISTED") || actionUpper.includes("LOCKDOWN") || actionUpper.includes("DELETED")) return "HIGH";
  if (actionUpper.includes("CREATED") || actionUpper.includes("GRANTED") || actionUpper.includes("CHANGED") || actionUpper.includes("UPDATED") || actionUpper.includes("TRANSFERRED") || actionUpper.includes("SET") || actionUpper.includes("TOGGLED")) return "MEDIUM";
  if (actionUpper.includes("LOGIN_SUCCESS") || actionUpper.includes("LOGOUT") || actionUpper.includes("VALIDATED") || actionUpper.includes("TRIAL")) return "LOW";
  return "MEDIUM";
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    License: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Auth: "bg-green-500/10 text-green-400 border-green-500/20",
    Premium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Coins: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Gems: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Role: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    Team: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    Device: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    Security: "bg-red-500/10 text-red-400 border-red-500/20",
    Broadcast: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Support: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    Moderation: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return colors[category] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

export default async function AuditLogsPage() {
  await requirePermission("View Audit Logs");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const totalLogs = logs.length;
  const todayLogs = logs.filter((log) => new Date(log.createdAt).toDateString() === new Date().toDateString()).length;
  const uniqueUsers = new Set(logs.map((log) => log.actorName).filter(Boolean)).size;
  const uniqueOrganizations = new Set(logs.map((log) => log.organization).filter(Boolean)).size;

  const actionCounts = logs.reduce<Record<string, number>>((acc, log) => {
    const cat = actionCategories[log.action] || "Other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit Logs"
        description="Enterprise activity tracking and security auditing. All actions are logged immutably."
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Events" value={totalLogs} icon={ClipboardList} color="blue" />
        <StatCard title="Today's Events" value={todayLogs} icon={CalendarDays} color="green" subtitle="Last 24 hours" />
        <StatCard title="Unique Actors" value={uniqueUsers} icon={Users} color="purple" />
        <StatCard title="Organizations" value={uniqueOrganizations} icon={Building2} color="yellow" />
      </StatCardGrid>

      {Object.keys(actionCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(actionCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => (
              <div key={category} className={`rounded-full border px-4 py-1.5 text-sm ${getCategoryColor(category)}`}>
                {category}: <span className="font-semibold">{count}</span>
              </div>
            ))}
        </div>
      )}

      <DataTable
        columns={[
          { key: "createdAt", label: "Time", sortable: true },
          { key: "category", label: "Category", sortable: true, searchable: true },
          { key: "severity", label: "Severity", sortable: true },
          { key: "action", label: "Action", sortable: true, searchable: true },
          { key: "organization", label: "Organization", sortable: true, searchable: true },
          { key: "actorName", label: "Actor", sortable: true, searchable: true },
          { key: "description", label: "Description", sortable: false, searchable: true, className: "max-w-md" },
        ]}
        rows={logs.map((log) => ({
          id: log.id,
          values: {
            createdAt: log.createdAt.toISOString(),
            category: actionCategories[log.action] || "Other",
            severity: getSeverity(log.action),
            action: log.action,
            organization: log.organization || "",
            actorName: log.actorName || "",
            description: log.description || "",
          },
          cells: [
            <span key="createdAt" className="whitespace-nowrap text-sm">{formatDateTime(log.createdAt)}</span>,
            <span key="category" className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${getCategoryColor(actionCategories[log.action] || "Other")}`}>
              {actionCategories[log.action] || "Other"}
            </span>,
            <span key="severity" className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${severityColors[getSeverity(log.action)] || severityColors.MEDIUM}`}>
              <ShieldAlert size={12} className="inline mr-1 -mt-0.5" />
              {getSeverity(log.action)}
            </span>,
            <span key="action" className="text-sm text-zinc-300">{log.action.replace(/_/g, " ").toLowerCase()}</span>,
            <span key="organization">{log.organization || "-"}</span>,
            <span key="actorName">{log.actorName || "-"}</span>,
            <span key="description" className="text-sm text-zinc-400">{log.description || "-"}</span>,
          ],
        }))}
        pageSize={15}
        searchPlaceholder="Search actions, users, organizations..."
        emptyMessage="No audit logs available yet. Actions will be recorded here as they occur."
      />
    </div>
  );
}
