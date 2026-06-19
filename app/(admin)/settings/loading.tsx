function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SkeletonBlock className="mb-2 h-7 w-56" />
        <SkeletonBlock className="h-4 w-72" />
      </div>

      {/* Stat cards (4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Section cards (6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-44" />
        ))}
      </div>

      {/* Danger zone */}
      <SkeletonBlock className="h-40" />
    </div>
  );
}
