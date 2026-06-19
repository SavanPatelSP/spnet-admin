"use client";

import { useState, useCallback } from "react";
import { Shield, ShieldOff, AlertTriangle, Save, Loader2, RotateCcw } from "lucide-react";

interface Policy {
  id: string;
  name: string;
  enabled: boolean;
  description: string | null;
  category: string;
  severity: string;
  systemManaged: boolean;
}

export function PolicyEditor({ policies: initial }: { policies: Policy[] }) {
  const [policies, setPolicies] = useState(initial);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const togglePolicy = useCallback(async (policy: Policy) => {
    setSaving((prev) => new Set(prev).add(policy.id));
    setPolicies((prev) =>
      prev.map((p) => (p.id === policy.id ? { ...p, enabled: !p.enabled } : p))
    );
    setDirty((prev) => new Set(prev).add(policy.id));

    try {
      const res = await fetch("/api/security/toggle-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: policy.id, enabled: !policy.enabled }),
      });
      if (!res.ok) {
        setPolicies((prev) =>
          prev.map((p) => (p.id === policy.id ? { ...p, enabled: policy.enabled } : p))
        );
      }
    } catch {
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, enabled: policy.enabled } : p))
      );
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(policy.id);
        return next;
      });
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(policy.id);
        return next;
      });
    }
  }, []);

  const severityColor: Record<string, string> = {
    Low: "text-green-400 bg-green-500/10",
    Medium: "text-yellow-400 bg-yellow-500/10",
    High: "text-red-400 bg-red-500/10",
    Critical: "text-red-500 bg-red-500/20",
  };

  if (policies.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-bold text-zinc-100">Security Policies</h2>
        <p className="py-8 text-center text-sm text-zinc-500">No security policies configured.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100">Security Policies</h2>
        {dirty.size > 0 && (
          <span className="rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-[10px] font-medium text-yellow-400">
            {dirty.size} unsaved
          </span>
        )}
      </div>

      <div className="hidden gap-4 border-b border-zinc-800 pb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:grid sm:grid-cols-[1fr_100px_80px_60px] lg:grid-cols-[1fr_120px_100px_80px]">
        <span>Policy</span>
        <span className="text-center">Category</span>
        <span className="text-center">Severity</span>
        <span className="text-center">Status</span>
      </div>

      <div className="divide-y divide-zinc-800/50">
        {policies.map((policy) => {
          const isSaving = saving.has(policy.id);
          return (
            <div
              key={policy.id}
              className="grid gap-3 py-3 sm:grid-cols-[1fr_100px_80px_60px] sm:items-center lg:grid-cols-[1fr_120px_100px_80px]"
            >
              <div className="flex items-start gap-3">
                {policy.enabled ? (
                  <Shield size={16} className="mt-0.5 shrink-0 text-green-500" />
                ) : (
                  <ShieldOff size={16} className="mt-0.5 shrink-0 text-zinc-600" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{policy.name}</p>
                  {policy.description && (
                    <p className="truncate text-xs text-zinc-500">{policy.description}</p>
                  )}
                  {policy.systemManaged && (
                    <span className="text-[9px] text-zinc-600">System managed</span>
                  )}
                </div>
              </div>

              <span className="hidden text-center text-xs text-zinc-500 sm:block">
                {policy.category}
              </span>

              <span className={`hidden items-center justify-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex ${severityColor[policy.severity] || "text-zinc-400 bg-zinc-500/10"}`}>
                {policy.severity === "High" && <AlertTriangle size={10} />}
                {policy.severity}
              </span>

              <div className="flex items-center justify-end gap-2 sm:justify-center">
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                ) : (
                  <button
                    onClick={() => togglePolicy(policy)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                      policy.enabled ? "bg-green-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        policy.enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                )}
                <span className={`text-[10px] font-medium sm:hidden ${
                  policy.enabled ? "text-green-400" : "text-zinc-500"
                }`}>
                  {policy.enabled ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
