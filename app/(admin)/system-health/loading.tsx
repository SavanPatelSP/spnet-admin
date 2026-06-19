function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function SystemHealthLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SkeletonBlock className="mb-2 h-7 w-44" />
        <SkeletonBlock className="h-4 w-64" />
      </div>

      {/* Stat cards (5) */}
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Service groups */}
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-48" />
      ))}

      {/* 3-column grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonBlock className="h-56" />
        <SkeletonBlock className="h-56" />
        <SkeletonBlock className="h-56" />
      </div>
    </div>
  );
}
