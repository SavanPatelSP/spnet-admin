"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { Monitor, XCircle, Loader2 } from "lucide-react";

interface Session {
  id: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

interface Props {
  teamMemberId: string;
}

export function UserSessionsPanel({ teamMemberId }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.TEAM_MEMBERS.SESSIONS_LIST}?teamMemberId=${teamMemberId}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? data ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [teamMemberId]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSessions();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchSessions]);

  async function revokeSession(sessionId: string) {
    setRevoking(sessionId);
    try {
      await fetch(API_ROUTES.TEAM_MEMBERS.SESSIONS_REVOKE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, teamMemberId }),
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      router.refresh();
    } finally {
      setRevoking(null);
    }
  }

  function truncateToken(token: string): string {
    if (token.length <= 20) return token;
    return token.slice(0, 10) + "..." + token.slice(-6);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/50 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
          <Monitor size={32} className="text-zinc-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-300">No Active Sessions</h3>
        <p className="mt-2 max-w-md text-sm text-zinc-500">This user has no active sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold">Active Sessions</h2>
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/40">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">Token</th>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">IP Address</th>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">User Agent</th>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">Created</th>
                <th className="p-4 text-left text-sm font-medium text-zinc-400">Expires</th>
                <th className="p-4 text-right text-sm font-medium text-zinc-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/20">
                  <td className="p-4">
                    <code className="rounded-md bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-300">
                      {truncateToken(session.token)}
                    </code>
                  </td>
                  <td className="p-4 text-sm text-zinc-300">{session.ipAddress}</td>
                  <td className="p-4 text-sm text-zinc-400 max-w-xs truncate">{session.userAgent}</td>
                  <td className="p-4 text-sm text-zinc-400">{session.createdAt ? new Date(session.createdAt).toLocaleString() : "-"}</td>
                  <td className="p-4 text-sm text-zinc-400">{session.expiresAt ? new Date(session.expiresAt).toLocaleString() : "-"}</td>
                  <td className="p-4 text-right">
                    <ActionButton
                      onClick={() => revokeSession(session.id)}
                      variant="danger"
                      size="sm"
                      loading={revoking === session.id}
                    >
                      <XCircle size={14} /> Revoke
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
