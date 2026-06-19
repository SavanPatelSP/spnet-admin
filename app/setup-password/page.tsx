"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import InvitePage from "@/app/invite/[token]/page";
import { Loader2 } from "lucide-react";

function SetupPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-900 p-8 text-center">
          <h1 className="text-xl font-bold text-white">Missing Token</h1>
          <p className="mt-2 text-sm text-zinc-400">No password setup token was provided.</p>
        </div>
      </div>
    );
  }

  return <InvitePage params={Promise.resolve({ token })} />;
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-zinc-500">Loading...</p>
          </div>
        </div>
      }
    >
      <SetupPasswordContent />
    </Suspense>
  );
}
