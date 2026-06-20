import { APP_NAME } from "@/lib/constants";
import { getAppEnvironment } from "@/lib/env";

export function AdminFooter() {
  const appEnv = getAppEnvironment();
  const envLabel = appEnv.charAt(0).toUpperCase() + appEnv.slice(1);
  const envColor = appEnv === "production" ? "bg-emerald-400/70"
    : appEnv === "staging" ? "bg-sky-400/70"
    : "bg-amber-400/70";

  return (
    <footer className="border-t border-zinc-800/40 bg-zinc-950/80 px-6 py-4">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="text-[11px] text-zinc-600">
          &copy; {new Date().getFullYear()} SP NET INC. All Rights Reserved.
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-600">{APP_NAME} Administration Platform</span>
          <span className="text-zinc-700/50">|</span>
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${envColor}`} />
            <span className="text-[10px] text-zinc-600">{envLabel}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
