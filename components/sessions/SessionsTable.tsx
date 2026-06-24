"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { formatDate, parseUA } from "@/lib/shared";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES } from "@/lib/constants";
import { SessionExtendModal } from "./SessionExtendModal";
import { SessionForceLogoutModal } from "./SessionForceLogoutModal";
import { SessionPolicyOverrideModal } from "./SessionPolicyOverrideModal";
import { SessionDetailDrawer } from "./SessionDetailDrawer";
import { Clock, XCircle, LogOut, ArrowUpCircle, Search, Crown, RefreshCw, Monitor, Smartphone, Users, User } from "lucide-react";

interface SessionRow {
  id: string;
  teamMemberId: string;
  teamMember: { name: string; email: string; role: { name: string } | null } | null;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
  overrideDurationMinutes: number | null;
  overrideCooldownMinutes: number | null;
  lastOverrideAt: Date | null;
}

export function SessionsTable({ sessions, currentUserRole }: { sessions: SessionRow[]; currentUserRole?: string }) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userFilter, setUserFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [ipFilter, setIpFilter] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [extendTarget, setExtendTarget] = useState<SessionRow | null>(null);
  const [logoutTarget, setLogoutTarget] = useState<SessionRow | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<SessionRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<SessionRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [groupByUser, setGroupByUser] = useState(false);
  const [sessionUpdates, setSessionUpdates] = useState<Map<string, Date>>(new Map());

  useEffect(() => {
    function onSessionUpdated(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.sessionId) {
        if (detail.expiresAt) {
          const newDate = new Date(detail.expiresAt);
          setSessionUpdates((prev) => {
            if (prev.get(detail.sessionId)?.getTime() === newDate.getTime()) return prev;
            const next = new Map(prev);
            next.set(detail.sessionId, newDate);
            return next;
          });
        } else {
          // Force-logout: mark as expired
          setSessionUpdates((prev) => {
            const next = new Map(prev);
            next.set(detail.sessionId, new Date(0));
            return next;
          });
        }
      }
    }
    window.addEventListener("session-updated", onSessionUpdated);
    return () => window.removeEventListener("session-updated", onSessionUpdated);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => router.refresh(), 60000);
    return () => clearInterval(id);
  }, [autoRefresh, router]);

  const users = useMemo(
    () => [...new Set(sessions.map((s) => s.teamMember?.email).filter((e): e is string => !!e))].sort(),
    [sessions]
  );

  const roles = useMemo(
    () => [...new Set(sessions.map((s) => s.teamMember?.role?.name).filter((r): r is string => !!r))].sort(),
    [sessions]
  );

  function effExpiresAt(s: SessionRow): Date {
    return sessionUpdates.get(s.id) || s.expiresAt;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      const isActive = effExpiresAt(s) > new Date();
      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "expired" && isActive) return false;
      if (userFilter && s.teamMember?.email !== userFilter) return false;
      if (roleFilter && s.teamMember?.role?.name !== roleFilter) return false;
      if (ipFilter && !(s.ipAddress || "").toLowerCase().includes(ipFilter.toLowerCase())) return false;
      if (q) {
        const text = `${s.teamMember?.name || ""} ${s.teamMember?.email || ""} ${s.userAgent || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, userFilter, statusFilter, roleFilter, ipFilter, search, sessionUpdates]);

  async function bulkRevoke() {
    if (!confirm(`Revoke ${selectedIds.size} session${selectedIds.size > 1 ? "s" : ""}?`)) return;
    for (const id of selectedIds) {
      await fetch(API_ROUTES.TEAM_MEMBERS.SESSIONS_REVOKE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
    }
    setSelectedIds(new Set());
    router.refresh();
  }

  function sessionWithUpdates(s: SessionRow): SessionRow {
    const updatedExpiry = sessionUpdates.get(s.id);
    if (updatedExpiry && updatedExpiry.getTime() !== s.expiresAt.getTime()) {
      return { ...s, expiresAt: updatedExpiry };
    }
    return s;
  }

  function handleExtend(s: SessionRow) {
    setExtendTarget(sessionWithUpdates(s));
  }

  function handleForceLogout(s: SessionRow) {
    setLogoutTarget(s);
  }

  function handleOverride(s: SessionRow) {
    setOverrideTarget(s);
  }

  const groups = useMemo(() => {
    if (!groupByUser) return null;
    const map = new Map<string, SessionRow[]>();
    for (const s of filtered) {
      const key = s.teamMemberId || "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const nameA = a[1][0]?.teamMember?.name || "";
      const nameB = b[1][0]?.teamMember?.name || "";
      return nameA.localeCompare(nameB);
    });
  }, [filtered, groupByUser]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <FilterBar
          filters={[
            {
              key: "user",
              label: "All Users",
              value: userFilter,
              onChange: setUserFilter,
              options: users.map((u) => ({ label: u, value: u })),
            },
            {
              key: "status",
              label: "All Statuses",
              value: statusFilter,
              onChange: (v) => setStatusFilter(v as "all" | "active" | "expired"),
              options: [
                { label: "Active", value: "active" },
                { label: "Expired", value: "expired" },
              ],
            },
            {
              key: "role",
              label: "All Roles",
              value: roleFilter,
              onChange: setRoleFilter,
              options: roles.map((r) => ({ label: r, value: r })),
            },
          ]}
          onClear={() => { setUserFilter(""); setStatusFilter("all"); setRoleFilter(""); setIpFilter(""); }}
        />
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={ipFilter}
            onChange={(e) => setIpFilter(e.target.value)}
            placeholder="Filter by IP..."
            className="h-9 rounded-xl border border-zinc-700 bg-zinc-800 pl-9 pr-3 text-sm text-zinc-200 outline-none focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, device..."
            className="h-9 rounded-xl border border-zinc-700 bg-zinc-800 pl-9 pr-3 text-sm text-zinc-200 outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => { setAutoRefresh(!autoRefresh); }}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
              autoRefresh ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-zinc-700 bg-zinc-800 text-zinc-500"
            }`}
          >
            <RefreshCw size={14} className={`mr-1 inline ${autoRefresh ? "animate-spin" : ""}`} />
            Auto
          </button>
          <button
            onClick={() => setGroupByUser(!groupByUser)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
              groupByUser ? "border-purple-500/30 bg-purple-500/10 text-purple-400" : "border-zinc-700 bg-zinc-800 text-zinc-500"
            }`}
          >
            <Users size={14} className="mr-1 inline" />
            Group
          </button>
          {selectedIds.size > 0 && hasPermission("Force Logout") && (
            <button onClick={bulkRevoke} className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
              <XCircle size={14} className="mr-1 inline" />
              Revoke {selectedIds.size}
            </button>
          )}
        </div>
      </div>

      {groupByUser && groups ? (
        <div className="space-y-6">
          {groups.map(([memberId, memberSessions]) => {
            const member = memberSessions[0]?.teamMember;
            const activeCount = memberSessions.filter((s) => effExpiresAt(s) > new Date()).length;
            return (
              <div key={memberId} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                      <User size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{member?.name || "Unknown"}</p>
                      <p className="text-xs text-zinc-500">{member?.email || ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>{activeCount} active / {memberSessions.length} total</span>
                    {member?.role?.name && (
                      <span className="rounded-full bg-zinc-700/50 px-2 py-0.5 text-[10px] text-zinc-400">{member.role.name}</span>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-zinc-800">
                  {memberSessions.map((s) => {
                    const ea = effExpiresAt(s);
                    const isActive = ea > new Date();
                    const parsed = s.userAgent ? parseUA(s.userAgent) : null;
                    return (
                      <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/50 transition-colors">
                        <button onClick={() => setDetailTarget(s)} className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            {parsed?.deviceType === "MOBILE" ? (
                              <Smartphone size={12} className="shrink-0 text-zinc-500" />
                            ) : (
                              <Monitor size={12} className="shrink-0 text-zinc-500" />
                            )}
                            <span className="text-xs text-zinc-400 truncate">
                              {parsed ? `${parsed.os} / ${parsed.browser}` : "Unknown device"}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-600">{s.ipAddress || ""}</span>
                          </div>
                        </button>
                        <span className="shrink-0 text-[10px] text-zinc-500">{formatDate(s.createdAt)}</span>
                        <span className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-500">
                          <Clock size={8} />
                          {formatDate(ea)}
                        </span>
                        <span className="shrink-0">
                          {isActive ? (
                            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">Active</span>
                          ) : (
                            <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400">Expired</span>
                          )}
                        </span>
                        <div className="shrink-0 flex items-center gap-1">
                          {isActive && hasPermission("Extend Sessions") && (
                            <button onClick={() => handleExtend(s)} className="rounded bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-500/20">Extend</button>
                          )}
                          {hasPermission("Override Session Policy") && (
                            <button onClick={() => handleOverride(s)} className="rounded bg-purple-500/10 px-2 py-1 text-[10px] font-medium text-purple-400 hover:bg-purple-500/20">Override</button>
                          )}
                          {hasPermission("Force Logout") && (
                            <button onClick={() => handleForceLogout(s)} className="rounded bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/20">Logout</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable
          key={refreshKey}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          columns={[
            { key: "user", label: "User", sortable: true, searchable: true },
            { key: "device", label: "Device", sortable: true, className: "hidden lg:table-cell" },
            { key: "ipAddress", label: "IP Address", sortable: true },
            { key: "status", label: "Status", sortable: true },
            { key: "createdAt", label: "Created", sortable: true },
            { key: "expiresAt", label: "Expires", sortable: true },
            { key: "actions", label: "Actions", className: "w-40" },
          ]}
          rows={filtered.map((s) => {
            const ea = effExpiresAt(s);
            const isActive = ea > new Date();
            const parsed = s.userAgent ? parseUA(s.userAgent) : null;
            const canExtend = isActive && hasPermission("Extend Sessions");
            const canOverride = hasPermission("Override Session Policy");
            const canForceLogout = hasPermission("Force Logout");
            const hasRowActions = canExtend || canOverride || canForceLogout;
            return {
              id: s.id,
              values: {
                user: s.teamMember?.name || s.teamMember?.email || "Unknown",
                device: parsed ? `${parsed.os} / ${parsed.browser}` : "Unknown",
                ipAddress: s.ipAddress || "",
                status: isActive ? "Active" : "Expired",
                createdAt: s.createdAt.toISOString(),
                expiresAt: ea.toISOString(),
                actions: "",
              },
              cells: [
                <div key="user" className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{s.teamMember?.name || "Unknown"}</p>
                  <p className="text-xs text-zinc-500">{s.teamMember?.email || ""}</p>
                  {s.teamMember?.role?.name && (
                    <span className="mt-1 inline-block rounded-full bg-zinc-700/50 px-1.5 py-0.5 text-[10px] text-zinc-400">{s.teamMember.role.name}</span>
                  )}
                </div>,
                <button key="device" onClick={() => setDetailTarget(s)} className="hidden max-w-[200px] truncate text-left text-xs text-zinc-400 transition-colors hover:text-blue-400 lg:table-cell">
                  {parsed ? (
                    <span className="flex items-center gap-1.5">
                      {parsed.deviceType === "MOBILE" || parsed.deviceType === "TABLET" ? (
                        <Smartphone size={10} className="shrink-0 text-zinc-500" />
                      ) : (
                        <Monitor size={10} className="shrink-0 text-zinc-500" />
                      )}
                      <span className="truncate">{parsed.os} / {parsed.browser}</span>
                    </span>
                  ) : <span className="text-zinc-600">-</span>}
                </button>,
                <span key="ip" className="font-mono text-xs text-zinc-400">{s.ipAddress || "-"}</span>,
                <span key="status">
                  {isActive ? (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">Active</span>
                  ) : (
                    <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-400">Expired</span>
                  )}
                </span>,
                <span key="created" className="text-xs text-zinc-400">{formatDate(s.createdAt)}</span>,
                <span key="expires" className="flex items-center gap-1 text-xs text-zinc-400">
                  <Clock size={10} />
                  {formatDate(ea)}
                </span>,
                hasRowActions ? (
                  <div key="actions" className="flex flex-wrap items-center gap-2">
                    {canExtend && (
                      <button onClick={() => handleExtend(s)} className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20">
                        <ArrowUpCircle size={12} className="mr-1 inline" /> Extend
                      </button>
                    )}
                    {canOverride && (
                      <button onClick={() => handleOverride(s)} className="rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/20">
                        <Crown size={12} className="mr-1 inline" /> Override
                      </button>
                    )}
                    {canForceLogout && (
                      <button onClick={() => handleForceLogout(s)} className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20">
                        <LogOut size={12} className="mr-1 inline" /> Force Logout
                      </button>
                    )}
                  </div>
                ) : null,
              ],
            };
          })}
          searchPlaceholder="Search by user name or email..."
          emptyMessage="No sessions found."
        />
      )}

      {extendTarget && (
        <SessionExtendModal
          session={extendTarget}
          onClose={() => setExtendTarget(null)}
          onSuccess={() => { setExtendTarget(null); setRefreshKey((k) => k + 1); router.refresh(); }}
        />
      )}
      {overrideTarget && (
        <SessionPolicyOverrideModal
          session={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onSuccess={() => { setOverrideTarget(null); setRefreshKey((k) => k + 1); router.refresh(); }}
        />
      )}
      {logoutTarget && (
        <SessionForceLogoutModal
          session={logoutTarget}
          onClose={() => setLogoutTarget(null)}
          onSuccess={() => { setLogoutTarget(null); setRefreshKey((k) => k + 1); router.refresh(); }}
        />
      )}

      {detailTarget && (
        <SessionDetailDrawer
          session={sessionWithUpdates(detailTarget)}
          onClose={() => setDetailTarget(null)}
          onExtend={handleExtend}
          onOverride={handleOverride}
          onForceLogout={handleForceLogout}
        />
      )}
    </>
  );
}
