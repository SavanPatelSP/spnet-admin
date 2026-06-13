"use client";

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", revenue: 400 },
  { month: "Feb", revenue: 800 },
  { month: "Mar", revenue: 1200 },
  { month: "Apr", revenue: 1600 },
  { month: "May", revenue: 2400 },
  { month: "Jun", revenue: 3200 },
];

export default function RevenueChart() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-xl font-semibold mb-4">
        Revenue Growth
      </h2>

      <div className="w-full h-[320px] min-w-0">
        <ResponsiveContainer width="99%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="month" />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
