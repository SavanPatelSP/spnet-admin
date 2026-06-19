"use client";

import { useState, useEffect } from "react";
import { API_ROUTES } from "@/lib/constants";
import { formatDate, cn } from "@/lib/shared";
import { Fingerprint, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface FingerprintData {
  id: string;
  fingerprint: string;
  firstSeenAt: string;
  lastSeenAt: string;
  activationCount: number;
  licenseIds?: string | null;
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
        setFingerprint(data.data?.deviceFingerprint ?? null);
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

  const licenseIdList = fingerprint.licenseIds ? JSON.parse(fingerprint.licenseIds) as string[] : [];

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
          <p className="text-xs text-zinc-500">Cross-License Appearances</p>
          <p className="mt-0.5 text-sm font-medium text-zinc-200">
            {fingerprint.activationCount} activation{fingerprint.activationCount === 1 ? "" : "s"}
            {licenseIdList.length > 0 && ` across ${licenseIdList.length} license${licenseIdList.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Shield size={12} />
        <span>First seen: {formatDate(fingerprint.firstSeenAt)}</span>
        <span className="text-zinc-700">|</span>
        <span>Last seen: {formatDate(fingerprint.lastSeenAt)}</span>
      </div>
    </div>
  );
}
