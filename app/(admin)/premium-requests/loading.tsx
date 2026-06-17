function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function PremiumRequestsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <SkeletonBlock className="mb-2 h-7 w-56" />
        <SkeletonBlock className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      <div className="space-y-2">
        <SkeletonBlock className="h-12 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
