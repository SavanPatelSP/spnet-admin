"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/shared";
import { API_ROUTES } from "@/lib/constants";
import { PLAN_META } from "@/lib/premium";
import { KeyRound, FileText, Check, Calendar, Monitor, AlertTriangle, RefreshCw, LayoutTemplate } from "lucide-react";
import { PLAN_PRICES } from "@/lib/constants";

const PLAN_PRICE_MAP = PLAN_PRICES as Record<string, number>;

function fmt(n: number) { return n.toLocaleString(); }

interface LicenseTemplate {
  id: string;
  name: string;
  description?: string;
  plan: string;
  maxDevices: number;
  durationDays: number;
  isActive: boolean;
  featureFlags?: string;
}

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-3 h-5 w-40 rounded bg-zinc-800" />
      <div className="mb-2 h-4 w-56 rounded bg-zinc-800" />
      <div className="flex gap-4">
        <div className="h-3 w-20 rounded bg-zinc-800" />
        <div className="h-3 w-24 rounded bg-zinc-800" />
        <div className="h-3 w-20 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

function LicenseDetailCard({ template }: { template: LicenseTemplate }) {
  const planName = PLAN_META[template.plan]?.label || template.plan;
  const planColor = PLAN_META[template.plan]?.color || "zinc";

  const colorMap: Record<string, string> = {
    zinc: "text-zinc-400", green: "text-green-400", blue: "text-blue-400",
    purple: "text-purple-400", amber: "text-amber-400", red: "text-red-400", cyan: "text-cyan-400",
  };

  const planTextColor = colorMap[planColor] || "text-zinc-400";

  return (
    <div className={cn(
      "rounded-2xl border bg-zinc-900 p-5 transition-all",
      template.isActive ? "border-zinc-700" : "border-zinc-800/50 opacity-60"
    )}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          <div>
            <h3 className="font-semibold text-zinc-100">{template.name}</h3>
            {template.description && (
              <p className="mt-0.5 text-xs text-zinc-500">{template.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!template.isActive && (
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">Inactive</span>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
          planColor === "cyan" ? "bg-cyan-500/20 text-cyan-400" :
          planColor === "purple" ? "bg-purple-500/20 text-purple-400" :
          planColor === "blue" ? "bg-blue-500/20 text-blue-400" :
          planColor === "green" ? "bg-green-500/20 text-green-400" :
          planColor === "amber" ? "bg-amber-500/20 text-amber-400" :
          planColor === "red" ? "bg-red-500/20 text-red-400" :
          "bg-zinc-500/20 text-zinc-400"
        )}>
          <LayoutTemplate size={10} />
          {planName}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
          <Monitor size={10} />
          {template.maxDevices} devices
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
          <Calendar size={10} />
          {template.durationDays} days
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div className="text-xs text-zinc-500">Plan</div>
        <div className={cn("text-xs font-medium", planTextColor)}>{planName}</div>
        <div className="text-xs text-zinc-500">Max Devices</div>
        <div className="text-xs text-zinc-300">{template.maxDevices}</div>
        <div className="text-xs text-zinc-500">Duration</div>
        <div className="text-xs text-zinc-300">{template.durationDays} days ({(template.durationDays / 30.44).toFixed(1)} months)</div>
        <div className="text-xs text-zinc-500">Plan Price</div>
        <div className="text-xs text-zinc-300">
          {PLAN_PRICE_MAP[template.plan] !== undefined
            ? `$${PLAN_PRICE_MAP[template.plan]}/mo`
            : "—"}
        </div>
        <div className="text-xs text-zinc-500">Status</div>
        <div className="text-xs">
          <span className={template.isActive ? "text-green-400" : "text-zinc-500"}>
            {template.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="text-xs text-zinc-500">Effective Devices</div>
        <div className="text-xs text-zinc-300">{template.maxDevices} max</div>
        <div className="text-xs text-zinc-500">License Duration</div>
        <div className="text-xs text-zinc-300">{template.durationDays} days from activation</div>
      </div>
    </div>
  );
}

export function LicensePackageOverview() {
  const [templates, setTemplates] = useState<LicenseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function fetchTemplates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ROUTES.LICENSES.TEMPLATES);
      if (!res.ok) throw new Error("Failed to load license templates");
      const data = await res.json();
      const list = data.templates ?? data ?? [];
      setTemplates(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  const selected = templates.find((t) => t.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <KeyRound size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">License Packages</h2>
            <p className="text-sm text-zinc-500">
              {templates.length > 0
                ? `${templates.length} template${templates.length !== 1 ? "s" : ""} configured`
                : "License templates define plan, device limits, and duration."}
            </p>
          </div>
        </div>
        <button
          onClick={fetchTemplates}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : templates.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12">
          <LayoutTemplate size={40} className="mb-3 text-zinc-600" />
          <p className="text-lg font-medium text-zinc-400">No License Templates Found</p>
          <p className="mt-1 text-sm text-zinc-600">
            Create license templates in Settings → Licensing to see them here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tpl) => (
              <LicenseDetailCard key={tpl.id} template={tpl} />
            ))}
          </div>

          {templates.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="mb-4 text-sm font-bold text-zinc-300">Summary</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500">Total Templates</p>
                  <p className="mt-1 text-xl font-bold text-zinc-100">{templates.length}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500">Active</p>
                  <p className="mt-1 text-xl font-bold text-green-400">{templates.filter((t) => t.isActive).length}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500">Avg. Devices</p>
                  <p className="mt-1 text-xl font-bold text-zinc-100">
                    {templates.length > 0 ? Math.round(templates.reduce((s, t) => s + t.maxDevices, 0) / templates.length) : 0}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500">Avg. Duration</p>
                  <p className="mt-1 text-xl font-bold text-zinc-100">
                    {templates.length > 0 ? `${Math.round(templates.reduce((s, t) => s + t.durationDays, 0) / templates.length)}d` : "0d"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-xs font-medium text-zinc-500">Plan Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    templates.reduce<Record<string, number>>((acc, t) => {
                      acc[t.plan] = (acc[t.plan] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort(([a], [b]) => (PLAN_PRICE_MAP[a] ?? 0) - (PLAN_PRICE_MAP[b] ?? 0)).map(([plan, count]) => {
                    const meta = PLAN_META[plan];
                    const color = meta?.color || "zinc";
                    const colorMap: Record<string, string> = {
                      zinc: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
                      green: "text-green-400 bg-green-500/10 border-green-500/20",
                      blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                      purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                      amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                      red: "text-red-400 bg-red-500/10 border-red-500/20",
                      cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
                    };
                    return (
                      <span key={plan} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", colorMap[color] || colorMap.zinc)}>
                        {meta?.label || plan}: {count}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
