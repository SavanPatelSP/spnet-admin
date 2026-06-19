function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function RolesLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="mb-2 h-7 w-48" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-11 w-32" />
      </div>

      {/* Stat cards (4) */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Role cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-48" />
      ))}

      {/* Permission explorer */}
      <SkeletonBlock className="h-48" />
    </div>
  );
}
