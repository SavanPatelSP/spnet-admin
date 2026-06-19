function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function SecurityLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="mb-2 h-7 w-52" />
          <SkeletonBlock className="h-4 w-80" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      <SkeletonBlock className="h-32" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SkeletonBlock className="h-96" />
        <div className="space-y-6">
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-32" />
        </div>
      </div>
    </div>
  );
}
