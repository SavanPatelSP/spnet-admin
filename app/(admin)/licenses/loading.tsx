function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function LicensesLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="mb-2 h-7 w-56" />
          <SkeletonBlock className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-24" />
          <SkeletonBlock className="h-10 w-36" />
          <SkeletonBlock className="h-10 w-36" />
        </div>
      </div>

      {/* Stat cards (6) */}
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Stat cards (3) */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Templates */}
      <SkeletonBlock className="h-48" />

      {/* Plan distribution */}
      <SkeletonBlock className="h-32" />

      {/* Table */}
      <div>
        <SkeletonBlock className="mb-3 h-5 w-40" />
        <SkeletonBlock className="h-12 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
