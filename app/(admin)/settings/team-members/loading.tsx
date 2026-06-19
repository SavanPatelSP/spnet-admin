function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function TeamMembersLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SkeletonBlock className="mb-2 h-7 w-44" />
        <SkeletonBlock className="h-4 w-72" />
      </div>

      {/* Stat cards (4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Invite + Ownership panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonBlock className="h-48" />
        </div>
        <SkeletonBlock className="h-48" />
      </div>

      {/* Members table + Security events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonBlock className="h-12 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
        <SkeletonBlock className="h-48" />
      </div>
    </div>
  );
}
