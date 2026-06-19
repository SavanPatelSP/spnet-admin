function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function SupportLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SkeletonBlock className="mb-2 h-7 w-36" />
        <SkeletonBlock className="h-4 w-56" />
      </div>

      {/* Stat cards (5) */}
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Tickets table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SkeletonBlock className="h-6 w-32" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
        <SkeletonBlock className="h-12 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
