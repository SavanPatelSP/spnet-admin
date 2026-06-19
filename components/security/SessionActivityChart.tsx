"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

interface DataPoint {
  date: string;
  sessions: number;
}

export function SessionActivityChart() {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/team-members/sessions/list?days=7");
        if (res.ok) {
          const json = await res.json();
          if (json.sessions) {
            const grouped: Record<string, number> = {};
            for (const s of json.sessions) {
              const d = new Date(s.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
              grouped[d] = (grouped[d] || 0) + 1;
            }
            const sorted = Object.entries(grouped).sort((a, b) => {
              const da = new Date(a[0]);
              const db = new Date(b[0]);
              return da.getTime() - db.getTime();
            });
            setData(sorted.map(([date, sessions]) => ({ date, sessions })));
          }
        }
      } catch {}
    }
    load();
  }, []);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity size={16} className="text-blue-400" />
        <h2 className="text-lg font-bold text-zinc-100">Session Activity (7 Days)</h2>
      </div>
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-zinc-500">No session data available yet.</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={{ stroke: "#27272a" }} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={{ stroke: "#27272a" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#e4e4e7" }}
              />
              <Area type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} fill="url(#sessionsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
