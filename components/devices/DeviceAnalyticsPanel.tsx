"use client";

import { useState, useEffect } from "react";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { API_ROUTES } from "@/lib/constants";
import { BarChart3, PieChart, TrendingUp, Monitor, Smartphone, Globe, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface AnalyticsData {
  totalDevices: number;
  blacklisted: number;
  avgTrustScore: number;
  byOS: Record<string, number>;
  byBrowser: Record<string, number>;
  byDeviceType: Record<string, number>;
  byCountry: Record<string, number>;
  trend: number[];
}

export function DeviceAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(API_ROUTES.DEVICES.ANALYTICS);
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const topCountries = (() => {
    if (!data?.byCountry) return [];
    return Object.entries(data.byCountry)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  })();

  const maxTrend = (() => {
    if (!data?.trend?.length) return 1;
    return Math.max(...data.trend, 1);
  })();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-sm text-zinc-500">{error || "Analytics data unavailable"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatCardGrid columns={3}>
        <StatCard
          title="Total Devices"
          value={data.totalDevices.toLocaleString()}
          icon={Monitor}
          color="blue"
        />
        <StatCard
          title="Blacklisted"
          value={data.blacklisted.toLocaleString()}
          icon={BarChart3}
          color="red"
          subtitle={`${data.totalDevices > 0 ? ((data.blacklisted / data.totalDevices) * 100).toFixed(1) : 0}% of total`}
        />
        <StatCard
          title="Avg Trust Score"
          value={`${Math.round(data.avgTrustScore)}%`}
          icon={TrendingUp}
          color={data.avgTrustScore >= 60 ? "green" : data.avgTrustScore >= 30 ? "yellow" : "red"}
        />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-400" />
            <h3 className="font-semibold">Devices by OS</h3>
          </div>
          {Object.keys(data.byOS).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.byOS)
                .sort(([, a], [, b]) => b - a)
                .map(([os, count]) => {
                  const pct = ((count / data.totalDevices) * 100).toFixed(1);
                  return (
                    <div key={os}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-zinc-300">{os}</span>
                        <span className="text-zinc-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No OS data</p>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-purple-400" />
            <h3 className="font-semibold">Devices by Browser</h3>
          </div>
          {Object.keys(data.byBrowser).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.byBrowser)
                .sort(([, a], [, b]) => b - a)
                .map(([browser, count]) => {
                  const pct = ((count / data.totalDevices) * 100).toFixed(1);
                  return (
                    <div key={browser}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-zinc-300">{browser}</span>
                        <span className="text-zinc-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800">
                        <div
                          className="h-2 rounded-full bg-purple-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No browser data</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Smartphone size={16} className="text-green-400" />
            <h3 className="font-semibold">Devices by Type</h3>
          </div>
          {Object.keys(data.byDeviceType).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.byDeviceType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const pct = ((count / data.totalDevices) * 100).toFixed(1);
                  return (
                    <div key={type}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-zinc-300">{type}</span>
                        <span className="text-zinc-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No device type data</p>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Globe size={16} className="text-yellow-400" />
            <h3 className="font-semibold">Top Countries</h3>
          </div>
          {topCountries.length > 0 ? (
            <div className="space-y-3">
              {topCountries.map(([country, count]) => {
                const pct = ((count / data.totalDevices) * 100).toFixed(1);
                return (
                  <div key={country}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{country}</span>
                      <span className="text-zinc-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-yellow-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No country data</p>
          )}
        </div>
      </div>

      {data.trend?.length > 0 && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <h3 className="font-semibold">Activation Trend (Last 30 Days)</h3>
          </div>
          <div className="flex items-end gap-1.5">
            {data.trend.map((val, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-blue-500/60"
                  style={{ height: `${Math.max(3, (val / maxTrend) * 64)}px` }}
                />
                <span className="text-[10px] text-zinc-500">{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      )}
    </div>
  );
}
