interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

export function Sparkline({ data, width = 120, height = 32, className = "", color = "#3b82f6" }: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 2) - 1}`).join(" ");

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  className?: string;
}

export function BarChart({ data, height = 40, className = "" }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(8, Math.min(24, 320 / data.length));

  return (
    <div className={`flex items-end gap-1 ${className}`} style={{ height }}>
      {data.map((d, i) => (
        <div
          key={d.label || i}
          className="rounded-t transition-all duration-300"
          style={{
            width: barWidth,
            height: `${(d.value / max) * 100}%`,
            backgroundColor: d.color || "#3b82f6",
            minHeight: d.value > 0 ? 2 : 0,
          }}
          title={`${d.label}: ${d.value}`}
        />
      ))}
    </div>
  );
}

interface MiniStatProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  sparklineData?: number[];
  color?: string;
}

export function MiniStat({ label, value, trend, trendLabel, sparklineData, color }: MiniStatProps) {
  const trendColor = trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-zinc-400";
  const dotColor = color || (trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#a1a1aa");

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="mb-1 text-xs text-zinc-500">{label}</p>
      <p className="text-xl font-bold text-zinc-100">{value}</p>
      {trend && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`text-xs font-medium ${trendColor}`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendLabel || ""}
          </span>
        </div>
      )}
      {sparklineData && <Sparkline data={sparklineData} color={dotColor} className="mt-2" />}
    </div>
  );
}
