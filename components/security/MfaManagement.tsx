"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldOff, RefreshCw, Copy, Check } from "lucide-react";
import { API_ROUTES } from "@/lib/constants";
import { ActionButton } from "@/components/ui/ActionButton";
import { Skeleton } from "@/components/ui/Skeleton";

interface TeamMemberMfa {
  id: string;
  name: string;
  email: string;
  mfaEnabled: boolean;
  status: string;
  role: string;
}

function generateHexSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function MfaManagement() {
  const [members, setMembers] = useState<TeamMemberMfa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [revealedForId, setRevealedForId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function fetchMembers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.MFA_LIST);
      if (!res.ok) throw new Error("Failed to load team members");
      const json = await res.json();
      setMembers(json.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(API_ROUTES.TEAM_MEMBERS.MFA_LIST);
        if (!res.ok) throw new Error("Failed to load team members");
        const json = await res.json();
        if (!cancelled) setMembers(json.data || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load team members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleEnable(member: TeamMemberMfa) {
    setActionLoadingId(member.id);
    setError("");
    try {
      const secret = generateHexSecret();
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.MFA_SETUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId: member.id, secret }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to enable MFA");
        return;
      }
      setRevealedSecret(secret);
      setRevealedForId(member.id);
      setCopied(false);
      await fetchMembers();
    } catch {
      setError("Network error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDisable(memberId: string) {
    setActionLoadingId(memberId);
    setError("");
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.MFA_DISABLE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId: memberId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to disable MFA");
        return;
      }
      await fetchMembers();
    } catch {
      setError("Network error");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCopy(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  const mfaEnabledCount = members.filter((m) => m.mfaEnabled).length;

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-4 h-4 w-64" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-zinc-800/30 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && members.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="mb-4 text-sm text-red-400">{error}</p>
        <button
          onClick={fetchMembers}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">MFA Management</h2>
          <p className="text-xs text-zinc-500">
            {mfaEnabledCount} of {members.length} team members have MFA enabled
          </p>
        </div>
        <button
          onClick={fetchMembers}
          className="rounded-xl bg-zinc-800 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {revealedSecret && revealedForId && (
        <div className="mx-6 mt-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-green-400">
              MFA Secret Generated for {members.find((m) => m.id === revealedForId)?.name || "user"}
            </p>
            <button
              onClick={() => handleCopy(revealedSecret)}
              className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <code className="block select-all break-all rounded-lg bg-zinc-800 p-3 font-mono text-sm text-green-400">
            {revealedSecret}
          </code>
          <p className="mt-2 text-xs text-zinc-500">
            Share this secret securely with the user to configure their authenticator app.
          </p>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 rounded-xl bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="p-6">
        {members.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">No team members found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">MFA Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-zinc-200">{member.name}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-zinc-400">{member.email}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-zinc-500">{member.role}</span>
                    </td>
                    <td className="py-3 pr-4">
                      {member.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
                          <Shield size={12} />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-500">
                          <ShieldOff size={12} />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {member.mfaEnabled ? (
                        <ActionButton
                          onClick={() => handleDisable(member.id)}
                          variant="danger"
                          size="sm"
                          loading={actionLoadingId === member.id}
                        >
                          <ShieldOff size={14} /> Disable
                        </ActionButton>
                      ) : (
                        <ActionButton
                          onClick={() => handleEnable(member)}
                          variant="primary"
                          size="sm"
                          loading={actionLoadingId === member.id}
                        >
                          <Shield size={14} /> Enable
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
