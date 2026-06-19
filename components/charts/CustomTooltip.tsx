'use client';

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface TooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  total?: number;
}

export function CustomTooltip({ active, payload, label, total }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const totalValue = total ?? payload.reduce((s, p) => s + (Number(p.value) || 0), 0);

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      {label && <p className="mb-2 text-xs font-medium text-zinc-300">{label}</p>}
      <div className="space-y-1.5">
        {payload.map((entry, i) => {
          const val = Number(entry.value) || 0;
          const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              {entry.color && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              )}
              <span className="text-zinc-400">{entry.name}</span>
              <span className="ml-auto font-medium text-zinc-200">{val.toLocaleString()}</span>
              <span className="text-zinc-500">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrendTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1 text-xs text-zinc-400">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          {entry.color && (
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          )}
          <span className="font-medium text-zinc-200">{Number(entry.value).toLocaleString()}</span>
          <span className="text-zinc-500">devices</span>
        </div>
      ))}
    </div>
  );
}
