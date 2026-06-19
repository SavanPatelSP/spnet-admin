"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";

export function RiskScoreChart() {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/devices/list");
        if (res.ok) {
          const json = await res.json();
          const activations = json.activations || json.data || [];
          const high = activations.filter((a: { trustScore: number }) => a.trustScore >= 60).length;
          const medium = activations.filter((a: { trustScore: number }) => a.trustScore >= 30 && a.trustScore < 60).length;
          const low = activations.filter((a: { trustScore: number }) => a.trustScore < 30).length;
          setData([
            { name: "High Trust (60+)", value: high, color: "#22c55e" },
            { name: "Medium Trust (30-59)", value: medium, color: "#eab308" },
            { name: "Low Trust (0-29)", value: low, color: "#ef4444" },
          ]);
        }
      } catch {}
    }
    load();
  }, []);

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-lg font-bold text-zinc-100">Device Trust Distribution</h2>
      {data.length === 0 || data.every((d) => d.value === 0) ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-zinc-500">No device data available yet.</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#e4e4e7" }}
              />
              <Legend
                formatter={(value) => <span style={{ color: "#a1a1aa", fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
