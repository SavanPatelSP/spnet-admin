function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function AuditLogsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SkeletonBlock className="mb-2 h-7 w-36" />
        <SkeletonBlock className="h-4 w-72" />
      </div>

      {/* Stat cards (4) */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Category distribution pills */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-8 w-28" />
        ))}
      </div>

      {/* Data table */}
      <SkeletonBlock className="h-12 w-full" />
      {Array.from({ length: 10 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
