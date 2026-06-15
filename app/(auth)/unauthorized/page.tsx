import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-950/30 ring-1 ring-red-500/20">
          <ShieldAlert className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-zinc-100">Access Denied</h1>
        <p className="mb-8 text-zinc-500">
          You don&apos;t have the required permissions to access this resource.
          Contact your administrator if you believe this is an error.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
