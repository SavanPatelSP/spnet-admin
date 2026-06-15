import { cn } from "@/lib/shared";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  gradient?: boolean;
  className?: string;
}

export function PageHeader({ title, description, actions, gradient = true, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        gradient && "rounded-3xl border border-zinc-800 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-8",
        !gradient && "",
        className,
      )}
    >
      <div className={cn(gradient ? "" : "space-y-1")}>
        <h1 className={cn("font-black tracking-tight", gradient ? "text-4xl" : "text-3xl")}>{title}</h1>
        {description && <p className={cn("mt-2", gradient ? "text-zinc-400" : "text-sm text-zinc-500")}>{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
