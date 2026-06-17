"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { Lock, Edit3, Save, Loader2 } from "lucide-react";

interface Policy {
  minLength: number;
  requireSpecialChars: boolean;
  expiryDays: number;
  lockoutThreshold: number;
}

export function UserPasswordPolicy() {
  const router = useRouter();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Policy>({
    minLength: 8,
    requireSpecialChars: true,
    expiryDays: 90,
    lockoutThreshold: 5,
  });

  async function fetchPolicy() {
    setLoading(true);
    try {
      const res = await fetch("/api/security");
      if (res.ok) {
        const data = await res.json();
        const p = data.passwordPolicy ?? data.policy ?? data;
        setPolicy(p);
        setForm(p);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      fetchPolicy();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function savePolicy() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(API_ROUTES.SECURITY.TOGGLE_POLICY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update policy");
        return;
      }
      setPolicy(form);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  const display = editing ? form : policy;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
            <Lock size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Password Policy</h3>
            <p className="text-sm text-zinc-500">Security requirements for user passwords.</p>
          </div>
        </div>
        {!editing ? (
          <ActionButton onClick={() => setEditing(true)} variant="secondary" size="sm">
            <Edit3 size={14} /> Edit
          </ActionButton>
        ) : (
          <ActionButton onClick={savePolicy} variant="primary" size="sm" loading={saving}>
            <Save size={14} /> Save
          </ActionButton>
        )}
      </div>
      {display && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Min Length</p>
            {editing ? (
              <input
                type="number"
                value={form.minLength}
                onChange={(e) => setForm((f) => ({ ...f, minLength: Number(e.target.value) }))}
                className="mt-1 w-24 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-blue-500"
              />
            ) : (
              <p className="mt-1 text-sm text-zinc-300">{display.minLength} characters</p>
            )}
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Special Characters</p>
            {editing ? (
              <label className="mt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.requireSpecialChars}
                  onChange={(e) => setForm((f) => ({ ...f, requireSpecialChars: e.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-600"
                />
                <span className="text-sm text-zinc-300">Required</span>
              </label>
            ) : (
              <p className="mt-1 text-sm text-zinc-300">{display.requireSpecialChars ? "Required" : "Not required"}</p>
            )}
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Expiry Days</p>
            {editing ? (
              <input
                type="number"
                value={form.expiryDays}
                onChange={(e) => setForm((f) => ({ ...f, expiryDays: Number(e.target.value) }))}
                className="mt-1 w-24 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-blue-500"
              />
            ) : (
              <p className="mt-1 text-sm text-zinc-300">{display.expiryDays} days</p>
            )}
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Lockout Threshold</p>
            {editing ? (
              <input
                type="number"
                value={form.lockoutThreshold}
                onChange={(e) => setForm((f) => ({ ...f, lockoutThreshold: Number(e.target.value) }))}
                className="mt-1 w-24 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-blue-500"
              />
            ) : (
              <p className="mt-1 text-sm text-zinc-300">{display.lockoutThreshold} attempts</p>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
