"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <div className="max-w-md rounded-3xl border border-red-900 bg-red-950/20 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition-colors hover:bg-red-500"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-3 font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Go to Dashboard
          </button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-zinc-600">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
