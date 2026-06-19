"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { API_ROUTES } from "@/lib/constants";
import { BarChart3, PieChart, TrendingUp, Monitor, Globe, Activity, RefreshCw, X, Info, Smartphone as PhoneIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePolling } from "@/lib/hooks/usePolling";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { ChartCard } from "@/components/charts/ChartCard";
import { CustomTooltip, TrendTooltip } from "@/components/charts/CustomTooltip";

interface AnalyticsData {
  totalDevices: number;
  blacklisted: number;
  averageTrustScore: number;
  byOs: { os: string; count: number }[];
  byBrowser: { browser: string; count: number }[];
  byDeviceType: { deviceType: string; count: number }[];
  byCountry: { country: string; count: number }[];
  trend: { date: string; count: number }[];
  trustDistribution: { range: string; count: number }[];
}

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#6366f1"];
const PIE_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#6366f1"];


interface DrillDownModalProps {
  title: string;
  data: { name: string; value: number }[];
  onClose: () => void;
}

function DrillDownModal({ title, data, onClose }: DrillDownModalProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>
        {data.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">No breakdown data available.</p>
        ) : (
          <div className="space-y-2">
            {data.map((item, i) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-zinc-800/50 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="flex-1 text-sm text-zinc-300">{item.name}</span>
                  <span className="text-sm font-medium text-zinc-200">{item.value.toLocaleString()}</span>
                  <span className="text-xs text-zinc-500">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TrustScoreChart({ data }: { data: AnalyticsData['trustDistribution'] }) {
  const chartData = useMemo(() => data.map((d) => ({ name: d.range, value: d.count })), [data]);
  const total = chartData.reduce((s, d) => s + d.value, 0);
  const [drillDown, setDrillDown] = useState<{ range: string } | null>(null);

  if (!data || data.length === 0) {
    return (
      <ChartCard title="Trust Score Distribution" icon={<BarChart3 size={16} className="text-green-400" />} subtitle="No data">
        <div className="flex h-48 flex-col items-center justify-center text-zinc-600">
          <Info size={24} className="mb-2" />
          <p className="text-sm">No Data Available</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Trust Score Distribution" subtitle={`${total} devices`} icon={<BarChart3 size={16} className="text-green-400" />}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} onClick={(e: unknown) => {
          const ev = e as { activePayload?: Array<{ payload: { name: string } }> };
          if (ev?.activePayload?.[0]) setDrillDown({ range: ev.activePayload[0].payload.name });
        }}>
          <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip total={total} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} cursor="pointer">
            {chartData.map((d, i) => {
              const ratio = i / (chartData.length - 1 || 1);
              const r = Math.round(239 * (1 - ratio));
              const g = Math.round(68 + 140 * ratio);
              const b = Math.round(68);
              return <Cell key={d.name} fill={`rgb(${r}, ${g}, ${b})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {drillDown && (
        <DrillDownModal title={`Trust Score: ${drillDown.range}`} data={[]} onClose={() => setDrillDown(null)} />
      )}
    </ChartCard>
  );
}

function OsChart({
  data,
  onDrillDown,
}: {
  data: { name: string; value: number }[];
  onDrillDown: (os: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const displayData = useMemo(() => {
    const filtered = data.filter((d) => !hidden.has(d.name));
    return showAll ? filtered : filtered.slice(0, 5);
  }, [data, showAll, hidden]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <ChartCard title="Devices by OS" icon={<BarChart3 size={16} className="text-blue-400" />} subtitle="No data">
        <div className="flex h-48 flex-col items-center justify-center text-zinc-600">
          <Monitor size={24} className="mb-2" />
          <p className="text-sm">No Data Available</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Devices by OS"
      subtitle={`${total} devices`}
      icon={<BarChart3 size={16} className="text-blue-400" />}
      action={
        <button
          onClick={() => setShowAll(!showAll)}
          className="rounded-lg px-2.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 sm:text-xs"
        >
          {showAll ? "Top 5" : `All (${data.length})`}
        </button>
      }
    >
      <ResponsiveContainer width="100%" height={Math.max(displayData.length * 44, 100)}>
        <BarChart data={displayData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}
          onClick={(e: unknown) => {
            const ev = e as { activePayload?: Array<{ payload: { name: string } }> };
            const name = ev?.activePayload?.[0]?.payload?.name;
            if (name) onDrillDown(name);
          }}>
          <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
          <Tooltip content={<CustomTooltip total={total} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} cursor="pointer">
            {displayData.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} opacity={hidden.has(entry.name) ? 0.3 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.map((entry, i) => (
          <button
            key={entry.name}
            onClick={() => setHidden((prev) => {
              const next = new Set(prev);
              if (next.has(entry.name)) next.delete(entry.name);
              else next.add(entry.name);
              return next;
            })}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition-colors sm:text-xs ${
              hidden.has(entry.name) ? "text-zinc-600" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {entry.name} ({entry.value})
          </button>
        ))}
      </div>
    </ChartCard>
  );
}

function BrowserChart({
  data,
  onDrillDown,
}: {
  data: { name: string; value: number }[];
  onDrillDown: (browser: string) => void;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <ChartCard title="Devices by Browser" icon={<PieChart size={16} className="text-purple-400" />} subtitle="No data">
        <div className="flex h-48 flex-col items-center justify-center text-zinc-600">
          <Globe size={24} className="mb-2" />
          <p className="text-sm">No Data Available</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Devices by Browser" subtitle={`${total} devices`} icon={<PieChart size={16} className="text-purple-400" />}>
      <ResponsiveContainer width="100%" height={220}>
        <RePieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={3}
            cursor="pointer"
            onClick={(_data: unknown, index: number) => {
              if (data[index]) onDrillDown(data[index].name);
            }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip total={total} />} />
        </RePieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {data.map((entry, i) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
          return (
            <button
              key={entry.name}
              onClick={() => onDrillDown(entry.name)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-zinc-400 transition-colors hover:text-zinc-200 sm:text-xs"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              {entry.name} ({pct}%)
            </button>
          );
        })}
      </div>
    </ChartCard>
  );
}

function DeviceTypeChart({
  data,
  onDrillDown,
}: {
  data: { name: string; value: number }[];
  onDrillDown: (deviceType: string) => void;
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const displayData = useMemo(() => data.filter((d) => !hidden.has(d.name)), [data, hidden]);
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <ChartCard title="Devices by Type" icon={<PhoneIcon size={16} className="text-green-400" />} subtitle="No data">
        <div className="flex h-48 flex-col items-center justify-center text-zinc-600">
          <Monitor size={24} className="mb-2" />
          <p className="text-sm">No Data Available</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Devices by Type" subtitle={`${total} devices`} icon={<PhoneIcon size={16} className="text-green-400" />}>
      <ResponsiveContainer width="100%" height={Math.max(displayData.length * 44, 100)}>
        <BarChart data={displayData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}
          onClick={(e: unknown) => {
            const ev = e as { activePayload?: Array<{ payload: { name: string } }> };
            const name = ev?.activePayload?.[0]?.payload?.name;
            if (name) onDrillDown(name);
          }}>
          <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
          <Tooltip content={<CustomTooltip total={total} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} cursor="pointer">
            {displayData.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[(i + 3) % COLORS.length]} opacity={hidden.has(entry.name) ? 0.3 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.map((entry, i) => (
          <button
            key={entry.name}
            onClick={() => setHidden((prev) => {
              const next = new Set(prev);
              if (next.has(entry.name)) next.delete(entry.name);
              else next.add(entry.name);
              return next;
            })}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition-colors sm:text-xs ${
              hidden.has(entry.name) ? "text-zinc-600" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
            {entry.name} ({entry.value})
          </button>
        ))}
      </div>
    </ChartCard>
  );
}

function CountryChart({ data }: { data: { name: string; value: number }[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayData = useMemo(() => showAll ? data : data.slice(0, 5), [data, showAll]);
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <ChartCard title="Top Countries" icon={<Globe size={16} className="text-yellow-400" />} subtitle="No data">
        <div className="flex h-48 flex-col items-center justify-center text-zinc-600">
          <Globe size={24} className="mb-2" />
          <p className="text-sm">No Data Available</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Countries"
      subtitle={`${total} devices`}
      icon={<Globe size={16} className="text-yellow-400" />}
      action={
        <button
          onClick={() => setShowAll(!showAll)}
          className="rounded-lg px-2.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 sm:text-xs"
        >
          {showAll ? "Top 5" : `All (${data.length})`}
        </button>
      }
    >
      <div className="overflow-x-auto">
        <ResponsiveContainer width="100%" height={Math.max(displayData.length * 44, 100)}>
          <BarChart data={displayData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
            <Tooltip content={<CustomTooltip total={total} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {displayData.map((_, i) => (
                <Cell key={i} fill={COLORS[(i + 5) % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const [range, setRange] = useState<'7' | '30' | '90'>('30');
  const trendData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const days = Number(range);
    const sliced = data.slice(-days);
    return days <= 7
      ? sliced.map((d) => ({ day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }), value: d.count }))
      : sliced.map((d, i) => ({ day: `${i + 1}`, value: d.count }));
  }, [data, range]);
  const total = trendData.reduce((s, d) => s + d.value, 0);

  if (!data || data.length === 0) {
    return (
      <ChartCard title="Activation Trend" icon={<Activity size={16} className="text-blue-400" />} subtitle="No data">
        <div className="flex h-48 flex-col items-center justify-center text-zinc-600">
          <Activity size={24} className="mb-2" />
          <p className="text-sm">No Data Available</p>
        </div>
      </ChartCard>
    );
  }

  const ranges = [
    { key: '7' as const, label: '7d' },
    { key: '30' as const, label: '30d' },
    { key: '90' as const, label: '90d' },
  ];

  return (
    <ChartCard
      title="Activation Trend"
      subtitle={`${total} activations`}
      icon={<Activity size={16} className="text-blue-400" />}
      action={
        <div className="flex gap-1 rounded-lg border border-zinc-800 p-0.5">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors sm:text-xs ${
                range === r.key ? 'bg-blue-500/20 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="trendGradientBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<TrendTooltip />} />
          <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#trendGradientBlue)" dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
        <span>{trendData.length > 0 ? trendData[0].day : ''}</span>
        <span>{trendData.length > 0 ? trendData[trendData.length - 1].day : ''}</span>
      </div>
    </ChartCard>
  );
}

export function DeviceAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [drillDown, setDrillDown] = useState<{ type: string; name: string } | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(API_ROUTES.DEVICES.ANALYTICS);
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json.success ? json.data : json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  usePolling(fetchAnalytics, 30000, autoRefresh);

  const osData = useMemo(() => data
    ? [...data.byOs].sort((a, b) => b.count - a.count).map((d) => ({ name: d.os || "Unknown", value: d.count }))
    : [], [data]);

  const browserData = useMemo(() => data
    ? [...data.byBrowser].sort((a, b) => b.count - a.count).map((d) => ({ name: d.browser || "Unknown", value: d.count }))
    : [], [data]);

  const deviceTypeData = useMemo(() => data
    ? [...data.byDeviceType].sort((a, b) => b.count - a.count).map((d) => ({ name: d.deviceType || "Unknown", value: d.count }))
    : [], [data]);

  const countryData = useMemo(() => data
    ? [...data.byCountry].sort((a, b) => b.count - a.count).map((d) => ({ name: d.country || "Unknown", value: d.count }))
    : [], [data]);

  const allEmpty = data && data.totalDevices === 0 && data.trustDistribution.every((d) => d.count === 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Device Analytics</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{autoRefresh ? "Auto-refreshing every 30s" : "Auto-refresh off"}</span>
            <button onClick={() => setAutoRefresh((p) => !p)} className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
              <RefreshCw size={14} className={autoRefresh ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-48 w-full" />
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Device Analytics</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{autoRefresh ? "Auto-refreshing every 30s" : "Auto-refresh off"}</span>
            <button onClick={() => setAutoRefresh((p) => !p)} className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
              <RefreshCw size={14} className={autoRefresh ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">{error || "Analytics data unavailable"}</p>
        </div>
      </div>
    );
  }

  if (allEmpty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Device Analytics</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{autoRefresh ? "Auto-refreshing every 30s" : "Auto-refresh off"}</span>
            <button onClick={() => setAutoRefresh((p) => !p)} className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
              <RefreshCw size={14} className={autoRefresh ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <Activity size={40} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-lg text-zinc-400">Awaiting Device Activity</p>
          <p className="mt-1 text-sm text-zinc-600">Analytics will populate once device data is available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Device Analytics</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{autoRefresh ? "Auto-refreshing every 30s" : "Auto-refresh off"}</span>
          <button onClick={() => setAutoRefresh((p) => !p)} className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
            <RefreshCw size={14} className={autoRefresh ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <StatCardGrid columns={3}>
        <StatCard title="Total Devices" value={data.totalDevices.toLocaleString()} icon={Monitor} color="blue" />
        <StatCard title="Blacklisted" value={data.blacklisted.toLocaleString()} icon={BarChart3} color="red"
          subtitle={`${data.totalDevices > 0 ? ((data.blacklisted / data.totalDevices) * 100).toFixed(1) : 0}% of total`} />
        <StatCard title="Avg Trust Score" value={`${Math.round(data.averageTrustScore)}%`} icon={TrendingUp}
          color={data.averageTrustScore >= 60 ? "green" : data.averageTrustScore >= 30 ? "yellow" : "red"} />
      </StatCardGrid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrustScoreChart data={data.trustDistribution} />
        <OsChart data={osData} onDrillDown={(name) => setDrillDown({ type: 'os', name })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BrowserChart data={browserData} onDrillDown={(name) => setDrillDown({ type: 'browser', name })} />
        <DeviceTypeChart data={deviceTypeData} onDrillDown={(name) => setDrillDown({ type: 'deviceType', name })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CountryChart data={countryData} />
        <TrendChart data={data.trend} />
      </div>

      {drillDown && (
        <DrillDownModal
          title={`${drillDown.type === 'os' ? 'OS' : drillDown.type === 'browser' ? 'Browser' : 'Device Type'}: ${drillDown.name}`}
          data={[]}
          onClose={() => setDrillDown(null)}
        />
      )}
    </div>
  );
}
