"use client";

import { useState, useEffect } from "react";
import { API_ROUTES } from "@/lib/constants";
import { formatDate, cn } from "@/lib/shared";
import { Fingerprint, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface FingerprintData {
  fingerprint: string;
  confidenceScore: number;
  firstSeen: string;
  lastSeen: string;
}

interface Props {
  activationId: string;
  initialFingerprint?: FingerprintData;
}

export function DeviceFingerprintCard({ activationId, initialFingerprint }: Props) {
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(initialFingerprint ?? null);
  const [loading, setLoading] = useState(!initialFingerprint);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialFingerprint) return;
    async function fetchFingerprint() {
      try {
        const res = await fetch(`${API_ROUTES.DEVICES.DETAIL}?id=${activationId}`);
        if (!res.ok) throw new Error("Failed to load fingerprint");
        const data = await res.json();
        setFingerprint(data.fingerprint ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load fingerprint");
      } finally {
        setLoading(false);
      }
    }
    fetchFingerprint();
  }, [activationId, initialFingerprint]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-3 h-8 w-full" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
    );
  }

  if (error || !fingerprint) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">No fingerprint data available</p>
      </div>
    );
  }

  const confidencePercent = Math.min(100, Math.max(0, fingerprint.confidenceScore));
  const gaugeColor = confidencePercent >= 80 ? "bg-green-500" : confidencePercent >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Fingerprint size={18} className="text-blue-400" />
        <h3 className="font-semibold">Device Fingerprint</h3>
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <p className="text-xs text-zinc-500">Fingerprint Hash</p>
          <p className="mt-0.5 font-mono text-sm text-zinc-200">
            {fingerprint.fingerprint.length > 32
              ? `${fingerprint.fingerprint.slice(0, 16)}...${fingerprint.fingerprint.slice(-16)}`
              : fingerprint.fingerprint}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Confidence Score</p>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex-1">
              <div className="h-2 rounded-full bg-zinc-800">
                <div
                  className={cn("h-2 rounded-full transition-all", gaugeColor)}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
            </div>
            <span className={cn("text-sm font-medium", gaugeColor.replace("bg-", "text-"))}>
              {confidencePercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Shield size={12} />
        <span>First seen: {formatDate(fingerprint.firstSeen)}</span>
        <span className="text-zinc-700">|</span>
        <span>Last seen: {formatDate(fingerprint.lastSeen)}</span>
      </div>
    </div>
  );
}
