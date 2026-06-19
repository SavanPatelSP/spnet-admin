function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function CoinsLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SkeletonBlock className="mb-2 h-7 w-52" />
        <SkeletonBlock className="h-4 w-64" />
      </div>

      {/* Stat cards (4) */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Analytics */}
      <SkeletonBlock className="h-48" />

      {/* 4-column grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-48" />
        ))}
      </div>

      {/* Balances table */}
      <div>
        <SkeletonBlock className="mb-4 h-7 w-40" />
        <SkeletonBlock className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>

      {/* Transaction history table */}
      <div>
        <SkeletonBlock className="mb-4 h-7 w-52" />
        <SkeletonBlock className="h-12 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
