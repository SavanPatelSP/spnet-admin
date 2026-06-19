function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function DevicesLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="mb-2 h-7 w-52" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-10 w-28" />
      </div>

      {/* Stat cards (8) */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Analytics panel */}
      <SkeletonBlock className="h-64" />

      {/* Table */}
      <div>
        <SkeletonBlock className="mb-3 h-5 w-32" />
        <SkeletonBlock className="h-12 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
