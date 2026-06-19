function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function ModerationLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SkeletonBlock className="mb-2 h-7 w-36" />
        <SkeletonBlock className="h-4 w-56" />
      </div>

      {/* Stat cards (4) */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Reports queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SkeletonBlock className="h-6 w-36" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
        <SkeletonBlock className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>

      {/* Moderation actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SkeletonBlock className="h-6 w-44" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
        <SkeletonBlock className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
