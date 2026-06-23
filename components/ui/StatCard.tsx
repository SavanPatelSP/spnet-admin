import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/shared";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "neutral"; label?: string };
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "default";
  subtitle?: string;
  href?: string;
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

export function StatCard({ title, value, icon: Icon, trend, color = "default", subtitle, href, className }: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <h3 className={cn("mt-1.5 text-2xl font-bold tracking-tight", color !== "default" ? colorMap[color] : "text-zinc-100")}>
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBgMap[color])}>
            <Icon size={20} className={colorMap[color]} />
          </div>
        )}
      </div>
      {(trend || subtitle) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium", trendColorMap[trend.direction], `${trendColorMap[trend.direction]}/10 bg`)}>
              {trendIconMap[trend.direction]} {trend.value}
              {trend.label && <span className="text-zinc-500 font-normal">{trend.label}</span>}
            </span>
          )}
          {subtitle && <span className="text-xs text-zinc-600">{subtitle}</span>}
        </div>
      )}
    </>
  );

  const classes = cn(
    "rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 transition-all duration-200 hover:border-zinc-700/50 hover:bg-zinc-900",
    href && "cursor-pointer",
    className,
  );

  if (href) {
    return <Link href={href} className={classes}>{inner}</Link>;
  }

  return <div className={classes}>{inner}</div>;
}

export function StatCardGrid({ children, columns = 4 }: { children: React.ReactNode; columns?: number }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        columns === 5 && "sm:grid-cols-2 lg:grid-cols-5",
        columns === 6 && "sm:grid-cols-3 lg:grid-cols-6",
      )}
    >
      {children}
    </div>
  );
}
