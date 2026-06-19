function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="mb-2 h-7 w-48" />
          <SkeletonBlock className="h-4 w-72" />
        </div>
      </div>

      {/* Critical alerts */}
      <SkeletonBlock className="h-16 w-full" />

      {/* Stat cards grid (6) */}
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Main content: 2/3 + 1/3 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="col-span-2">
          <SkeletonBlock className="h-72" />
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-36" />
          <SkeletonBlock className="h-36" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <SkeletonBlock className="mb-4 h-6 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-32" />
          ))}
        </div>
      </div>
    </div>
  );
}
