"use client";

import { useEffect, useState } from "react";

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function SessionLiveCountdown({ expiresAt }: { expiresAt: string }) {
  const now = useNow();
  const target = new Date(expiresAt).getTime();
  const remaining = Math.max(0, Math.floor((target - now) / 1000));
  const isActive = remaining > 0;

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <span className={`font-mono text-sm ${isActive ? "text-green-400" : "text-red-400"}`}>
      {isActive
        ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        : "Expired"}
    </span>
  );
}

export function SessionOverrideStatus({ overrideDurationMinutes, lastOverrideAt, expiresAt }: { overrideDurationMinutes: number | null; lastOverrideAt: string | null; expiresAt?: string | null }) {
  if (!overrideDurationMinutes && !lastOverrideAt && !expiresAt) {
    return <span className="text-sm text-zinc-500">None</span>;
  }
  const parts: string[] = [];
  if (overrideDurationMinutes) {
    if (overrideDurationMinutes === -1) parts.push("Unlimited");
    else {
      const h = Math.floor(overrideDurationMinutes / 60);
      const m = overrideDurationMinutes % 60;
      parts.push(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
  }
  if (lastOverrideAt) {
    const d = new Date(lastOverrideAt);
    parts.push(`at ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`);
  }
  if (!overrideDurationMinutes && expiresAt) {
    const originalExpiry = new Date(expiresAt);
    parts.push(`(policy: expires ${originalExpiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })})`);
  }
  return <span className="text-sm text-amber-400">{parts.join(" ")}</span>;
}

export function SessionCooldownStatus({ overrideCooldownMinutes, lastOverrideAt }: { overrideCooldownMinutes: number | null; lastOverrideAt: string | null }) {
  const now = useNow();

  if (overrideCooldownMinutes == null) {
    return <span className="text-sm text-zinc-500">Default policy</span>;
  }
  if (overrideCooldownMinutes === 0) {
    return <span className="text-sm text-zinc-500">No cooldown</span>;
  }

  const cooldownEnd = lastOverrideAt
    ? new Date(new Date(lastOverrideAt).getTime() + overrideCooldownMinutes * 60 * 1000)
    : null;

  const remaining = cooldownEnd
    ? Math.max(0, Math.floor((cooldownEnd.getTime() - now) / 1000))
    : 0;

  return (
    <span className={`text-sm ${remaining > 0 ? "text-yellow-400" : "text-green-400"}`}>
      {remaining > 0
        ? `${Math.floor(remaining / 60)}m ${remaining % 60}s remaining`
        : "Cooldown expired"}
    </span>
  );
}
