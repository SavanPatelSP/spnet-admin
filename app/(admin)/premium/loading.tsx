import { Crown } from "lucide-react";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function PremiumLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="mb-2 h-7 w-48" />
          <SkeletonBlock className="h-4 w-72" />
        </div>
        <SkeletonBlock className="h-10 w-36" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <SkeletonBlock className="mb-3 h-5 w-32" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24" />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div>
        <SkeletonBlock className="mb-3 h-5 w-40" />
        <div className="space-y-2">
          <SkeletonBlock className="h-12 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Analytics skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <SkeletonBlock className="h-48" />
        <SkeletonBlock className="h-48" />
      </div>

      {/* Timeline skeleton */}
      <SkeletonBlock className="h-32" />
    </div>
  );
}
