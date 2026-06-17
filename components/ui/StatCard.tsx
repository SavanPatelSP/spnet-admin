import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/shared";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "neutral"; label?: string };
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "default";
  subtitle?: string;
  className?: string;
}

const colorMap = {
  default: "text-zinc-400",
  blue: "text-blue-400",
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
  purple: "text-purple-400",
};

const iconBgMap = {
  default: "bg-zinc-800",
  blue: "bg-blue-500/10",
  green: "bg-green-500/10",
  yellow: "bg-yellow-500/10",
  red: "bg-red-500/10",
  purple: "bg-purple-500/10",
};

const trendColorMap = {
  up: "text-green-400",
  down: "text-red-400",
  neutral: "text-zinc-400",
};

const trendIconMap = {
  up: "↑",
  down: "↓",
  neutral: "→",
};

export function StatCard({ title, value, icon: Icon, trend, color = "default", subtitle, className }: StatCardProps) {
  return (
    <div className={cn("rounded-3xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-zinc-700", className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-zinc-500">{title}</p>
        {Icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", iconBgMap[color])}>
            <Icon size={20} className={colorMap[color]} />
          </div>
        )}
      </div>
      <h2 className={cn("mt-2 text-3xl font-bold", color !== "default" && colorMap[color])}>
        {value}
      </h2>
      {(trend || subtitle) && (
        <div className="mt-1 flex items-center gap-2">
          {trend && (
            <span className={cn("text-xs font-medium", trendColorMap[trend.direction])}>
              {trendIconMap[trend.direction]} {trend.value}
              {trend.label && <span className="text-zinc-600"> {trend.label}</span>}
            </span>
          )}
          {subtitle && <span className="text-xs text-zinc-600">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

export function StatCardGrid({ children, columns = 4 }: { children: React.ReactNode; columns?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-3",
        columns === 4 && "md:grid-cols-4",
        columns === 5 && "md:grid-cols-5",
        columns === 6 && "md:grid-cols-6",
      )}
    >
      {children}
    </div>
  );
}
