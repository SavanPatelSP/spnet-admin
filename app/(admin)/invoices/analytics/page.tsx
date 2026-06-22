"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard, StatCardGrid } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/shared";
import { ArrowLeft, TrendingUp, DollarSign, FileText, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1"];

interface AnalyticsSummary {
  totalRevenue: number;
  outstanding: number;
  totalInvoices: number;
}

interface AnalyticsData {
  success: boolean;
  summary: AnalyticsSummary;
  revenueByCategory: { name: string; value: number }[];
  revenueByAction: { name: string; value: number }[];
  growth: { date: string; revenue: number; count: number }[];
  countsByStatus: Record<string, number>;
}

export default function InvoiceAnalyticsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices/analytics")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
        else throw new Error(d.error || "Failed to load analytics");
      })
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const categoryData = useMemo(() => data?.revenueByCategory || [], [data]);
  const actionData = useMemo(() => data?.revenueByAction || [], [data]);
  const growthData = useMemo(() => data?.growth || [], [data]);
  const statusCounts = useMemo(() => data?.countsByStatus || {}, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Invoice Analytics"
        description="Revenue, counts, growth trends and outstanding invoices."
        actions={
          <button
            onClick={() => router.push("/invoices")}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      <StatCardGrid columns={4}>
        <StatCard title="Total Revenue" value={formatPrice((data?.summary?.totalRevenue || 0) / 100, "$")} icon={DollarSign} color="green" />
        <StatCard title="Outstanding" value={formatPrice((data?.summary?.outstanding || 0) / 100, "$")} icon={Clock} color="yellow" />
        <StatCard title="Invoices" value={data?.summary?.totalInvoices || 0} icon={FileText} color="blue" />
        <StatCard title="Growth" value={growthData.length} icon={TrendingUp} color="purple" />
      </StatCardGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Revenue by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((_: Record<string, unknown>, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown, _name: unknown, _item: unknown, _index: number, _payload: unknown) => formatPrice(Number(value ?? 0) / 100, "$")} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Revenue by Action</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionData}>
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(v) => `$${v / 100}`} />
                <Tooltip formatter={(value: unknown, _name: unknown, _item: unknown, _index: number, _payload: unknown) => formatPrice(Number(value ?? 0) / 100, "$")} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Growth Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(v) => `$${v / 100}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#71717a", fontSize: 10 }} />
                <Tooltip formatter={(value: unknown, name: unknown, _item: unknown, _index: number, _payload: unknown) => String(name) === "revenue" ? formatPrice(Number(value ?? 0) / 100, "$") : String(value)} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Invoice Counts by Status</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3 text-center">
                <p className="text-xs text-zinc-500">{status}</p>
                <p className="text-xl font-bold text-zinc-200">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
