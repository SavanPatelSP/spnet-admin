"use client";

import { Shield, ShieldOff, AlertTriangle } from "lucide-react";

interface Policy {
  id: string;
  name: string;
  enabled: boolean;
  description: string | null;
  category: string;
  severity: string;
}

export function SecurityPoliciesList({ policies }: { policies: Policy[] }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-lg font-bold text-zinc-100">Security Policies</h2>
      <div className="space-y-2">
        {policies.length === 0 ? (
          <p className="text-sm text-zinc-500">No security policies configured.</p>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800/50 bg-zinc-800/30 px-4 py-3 transition-colors hover:bg-zinc-800/50"
            >
              <div className="flex items-start gap-3">
                {policy.enabled ? (
                  <Shield size={16} className="mt-0.5 shrink-0 text-green-500" />
                ) : (
                  <ShieldOff size={16} className="mt-0.5 shrink-0 text-zinc-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-200">{policy.name}</p>
                  <p className="text-xs text-zinc-500">
                    {policy.category}
                    {policy.severity === "High" && (
                      <span className="ml-2 inline-flex items-center gap-1 text-yellow-400">
                        <AlertTriangle size={10} /> High
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                  policy.enabled
                    ? "bg-green-500/10 text-green-400"
                    : "bg-zinc-500/10 text-zinc-500"
                }`}
              >
                {policy.enabled ? "Active" : "Disabled"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
