function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/50 ${className}`} />;
}

export default function TicketDetailLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <SkeletonBlock className="mb-2 h-7 w-96" />
        <SkeletonBlock className="h-4 w-48" />
      </div>

      {/* 2/3 + 1/3 layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <SkeletonBlock className="h-40" />
          {/* Notes */}
          <SkeletonBlock className="h-64" />
        </div>

        <div className="space-y-4">
          {/* Details sidebar */}
          <SkeletonBlock className="h-64" />
          {/* Actions */}
          <SkeletonBlock className="h-32" />
        </div>
      </div>
    </div>
  );
}
