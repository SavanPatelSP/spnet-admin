"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="max-w-md rounded-3xl border border-red-900 bg-red-950/20 p-8 text-center">
          <h2 className="text-xl font-bold text-red-400">Fatal Error</h2>
          <p className="mt-2 text-sm text-zinc-400">
            The application encountered a critical error. Please try reloading.
          </p>
          <button
            onClick={reset}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition-colors hover:bg-red-500"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
