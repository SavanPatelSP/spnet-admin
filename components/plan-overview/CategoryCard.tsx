"use client";

import { cn } from "@/lib/shared";
import { type LucideIcon, ArrowRight } from "lucide-react";

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  planCount: number;
  summary: string;
  color: string;
  onClick: () => void;
}

const colorMap: Record<string, { text: string; border: string; bg: string; iconBg: string; hover: string }> = {
  purple: { text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10", iconBg: "bg-purple-500/10", hover: "hover:border-purple-500/40" },
  yellow: { text: "text-yellow-400", border: "border-yellow-500/20", bg: "bg-yellow-500/10", iconBg: "bg-yellow-500/10", hover: "hover:border-yellow-500/40" },
  blue: { text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", iconBg: "bg-blue-500/10", hover: "hover:border-blue-500/40" },
  green: { text: "text-green-400", border: "border-green-500/20", bg: "bg-green-500/10", iconBg: "bg-green-500/10", hover: "hover:border-green-500/40" },
  amber: { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", iconBg: "bg-amber-500/10", hover: "hover:border-amber-500/40" },
  cyan: { text: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/10", iconBg: "bg-cyan-500/10", hover: "hover:border-cyan-500/40" },
};

export function CategoryCard({ icon: Icon, title, description, planCount, summary, color, onClick }: CategoryCardProps) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start rounded-2xl border bg-zinc-900 p-6 text-left transition-all duration-300",
        c.border, c.hover, "hover:-translate-y-0.5 hover:shadow-lg"
      )}
    >
      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", c.iconBg)}>
        <Icon size={28} className={c.text} />
      </div>

      <h3 className="mt-4 text-lg font-bold text-zinc-100">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>

      <div className="mt-4 flex items-center gap-2">
        <span className={cn("rounded-full px-3 py-1 text-xs font-medium", c.bg, c.text)}>
          {planCount} {planCount === 1 ? "Plan" : "Plans"}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-zinc-600">{summary}</p>

      <div className="mt-auto flex w-full items-center justify-between pt-4">
        <span className={cn("flex items-center gap-1 text-xs font-medium transition-colors group-hover:gap-2", c.text)}>
          Browse Plans <ArrowRight size={12} />
        </span>
      </div>
    </button>
  );
}
