import { cn } from "@/lib/shared";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
  stats?: React.ReactNode;
}

export function PageHeader({ title, description, actions, className, badge, stats }: PageHeaderProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{title}</h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="mt-1.5 text-sm text-zinc-500 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      {stats && <div>{stats}</div>}
    </div>
  );
}
