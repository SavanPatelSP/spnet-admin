function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function SecurityLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SkeletonBlock className="mb-2 h-7 w-40" />
        <SkeletonBlock className="h-4 w-64" />
      </div>

      {/* Stat cards (4) */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Security policies */}
      <div>
        <SkeletonBlock className="mb-4 h-6 w-44" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-20" />
          ))}
        </div>
      </div>
    </div>
  );
}
