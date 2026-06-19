"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-red-900 bg-red-950/20 p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
        <AlertTriangle size={32} className="text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        {error.message || "An unexpected error occurred in this section."}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition-colors hover:bg-red-500"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-3 font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
        >
          Go to Dashboard
        </button>
      </div>
      {error.digest && (
        <p className="mt-4 text-xs text-zinc-600">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
