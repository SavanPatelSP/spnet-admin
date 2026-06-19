'use client';

import { type ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, action, children, icon, className = '' }: ChartCardProps) {
  return (
    <div className={`rounded-3xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <span className="shrink-0">{icon}</span>}
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 sm:text-base">{title}</h3>
            {subtitle && <p className="text-[10px] text-zinc-500 sm:text-xs">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}
