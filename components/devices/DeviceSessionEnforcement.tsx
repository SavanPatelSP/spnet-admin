"use client";

import { useState, useEffect } from "react";
import { API_ROUTES } from "@/lib/constants";
import { Monitor, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface SessionData {
  activeSessions: number;
  maxDevices: number;
}

interface Props {
  licenseId: string;
}

export function DeviceSessionEnforcement({ licenseId }: Props) {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_ROUTES.DEVICES.SESSION_ENFORCEMENT}?licenseId=${licenseId}`);
        if (!res.ok) throw new Error("Failed to load session data");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load session data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [licenseId]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-20" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">Session enforcement data unavailable</p>
      </div>
    );
  }

  const { activeSessions, maxDevices } = data;
  const utilization = maxDevices > 0 ? Math.round((activeSessions / maxDevices) * 100) : 0;
  const isOverLimit = activeSessions > maxDevices;
  const isNearLimit = utilization >= 80 && utilization < 100;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Monitor size={18} className="text-blue-400" />
        <h3 className="font-semibold">Session Enforcement</h3>
        {(isOverLimit || isNearLimit) && (
          <AlertTriangle size={16} className={isOverLimit ? "text-red-400" : "text-yellow-400"} />
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-zinc-100">{activeSessions}</span>
        <span className="text-sm text-zinc-500">/ {maxDevices} devices</span>
      </div>

      <div className="mt-3">
        <div className="h-2.5 rounded-full bg-zinc-800">
          <div
            className={`h-2.5 rounded-full transition-all ${
              isOverLimit ? "bg-red-500" : isNearLimit ? "bg-yellow-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={isOverLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-green-400"}>
            {utilization}% utilized
          </span>
          <span className="text-zinc-500">
            {isOverLimit ? "Over limit" : `${maxDevices - activeSessions} remaining`}
          </span>
        </div>
      </div>
    </div>
  );
}
