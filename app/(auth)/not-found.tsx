import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function AuthNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
      <div className="max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
          <FileQuestion size={32} className="text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Page Not Found</h2>
        <p className="mt-2 text-sm text-zinc-400">
          The authentication page you are looking for does not exist.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-500"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
