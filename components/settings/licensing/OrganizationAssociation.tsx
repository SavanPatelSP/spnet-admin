"use client";

import { useState, useMemo } from "react";
import { cn, formatDate } from "@/lib/shared";
import { ChevronDown, ChevronRight, Building2, KeyRound, Activity } from "lucide-react";

interface OrgLicense {
  id: string;
  key: string;
  plan: string;
  status: string;
  expiresAt: string | Date;
  activationCount: number;
  maxDevices: number;
}

interface OrgGroup {
  name: string;
  initials: string;
  totalLicenses: number;
  totalActivations: number;
  licenses: OrgLicense[];
}

interface OrganizationAssociationProps {
  groups: OrgGroup[];
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const statusDot: Record<string, string> = {
  ACTIVE: "bg-green-400",
  SUSPENDED: "bg-yellow-400",
  PENDING: "bg-blue-400",
  EXPIRED: "bg-red-400",
  REVOKED: "bg-zinc-400",
};

export function OrganizationAssociation({ groups, className }: OrganizationAssociationProps) {
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => [...groups].sort((a, b) => b.totalLicenses - a.totalLicenses), [groups]);

  function toggleOrg(name: string) {
    setExpandedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (sorted.length === 0) {
    return (
      <div className={cn("rounded-3xl border border-zinc-800 bg-zinc-900 p-6", className)}>
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-zinc-400" />
          <h2 className="text-lg font-semibold">Organization Association</h2>
        </div>
        <p className="py-6 text-center text-sm text-zinc-600">No organizations found</p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-3xl border border-zinc-800 bg-zinc-900 p-6", className)}>
      <div className="mb-4 flex items-center gap-2">
        <Building2 size={18} className="text-zinc-400" />
        <h2 className="text-lg font-semibold">Organization Association</h2>
        <span className="ml-auto text-xs text-zinc-500">{sorted.length} orgs</span>
      </div>
      <div className="space-y-2">
        {sorted.map((org) => {
          const isExpanded = expandedOrgs.has(org.name);
          return (
            <div key={org.name} className="overflow-hidden rounded-xl border border-zinc-800 transition-all">
              <button
                onClick={() => toggleOrg(org.name)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                  {org.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">{org.name}</p>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <KeyRound size={10} /> {org.totalLicenses} license{org.totalLicenses !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity size={10} /> {org.totalActivations} activation{org.totalActivations !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={16} className="shrink-0 text-zinc-500" /> : <ChevronRight size={16} className="shrink-0 text-zinc-500" />}
              </button>
              {isExpanded && (
                <div className="border-t border-zinc-800">
                  {org.licenses.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 border-b border-zinc-800/50 px-4 py-2.5 last:border-0">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", statusDot[l.status] || "bg-zinc-500")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-blue-400">{l.key}</span>
                          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">{l.plan}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                          <span>{l.activationCount}/{l.maxDevices} devices</span>
                          <span>·</span>
                          <span>Expires {formatDate(l.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
