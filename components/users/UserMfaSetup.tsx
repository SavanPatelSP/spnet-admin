"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { Shield, ShieldOff } from "lucide-react";

interface Props {
  teamMemberId: string;
  mfaEnabled: boolean;
}

function generateHexSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function UserMfaSetup({ teamMemberId, mfaEnabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(mfaEnabled);

  async function enableMfa() {
    setLoading(true);
    setError(null);
    try {
      const generatedSecret = generateHexSecret();
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.MFA_SETUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId, secret: generatedSecret }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to enable MFA");
        return;
      }
      setSecret(generatedSecret);
      setEnabled(true);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function disableMfa() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.MFA_DISABLE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to disable MFA");
        return;
      }
      setEnabled(false);
      setSecret(null);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (enabled && secret) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
            <Shield size={24} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-400">MFA Active</h3>
            <p className="text-sm text-zinc-400">Multi-factor authentication is enabled.</p>
          </div>
        </div>
        <div className="mb-4 rounded-xl border border-zinc-700 bg-zinc-800 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Setup Secret</p>
          <code className="block select-all break-all font-mono text-sm text-green-400">{secret}</code>
        </div>
        <ActionButton onClick={disableMfa} variant="danger" size="sm" loading={loading}>
          <ShieldOff size={14} /> Disable MFA
        </ActionButton>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  if (enabled) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
            <Shield size={24} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-green-400">MFA Active</h3>
            <p className="text-sm text-zinc-400">Multi-factor authentication is enabled.</p>
          </div>
        </div>
        <ActionButton onClick={disableMfa} variant="danger" size="sm" loading={loading}>
          <ShieldOff size={14} /> Disable MFA
        </ActionButton>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800">
          <ShieldOff size={24} className="text-zinc-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-zinc-300">MFA Not Enabled</h3>
          <p className="text-sm text-zinc-500">
            Multi-factor authentication adds an extra layer of security.
          </p>
        </div>
      </div>
      <ActionButton onClick={enableMfa} variant="primary" size="sm" loading={loading}>
        <Shield size={14} /> Enable MFA
      </ActionButton>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
