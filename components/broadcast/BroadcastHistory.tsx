"use client";

import { Megaphone, Eye, MousePointerClick, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDate, cn } from "@/lib/shared";
import { BroadcastActions } from "@/app/(admin)/broadcasts/BroadcastActions";

interface BroadcastItem {
  id: string;
  subject: string;
  type: string;
  audience: string;
  status: string;
  sentCount: number;
  targetCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
}

export function BroadcastHistory({ broadcasts }: { broadcasts: BroadcastItem[] }) {
  const TARGET_LABELS: Record<string, string> = {
    ALL: "All Users",
    PREMIUM: "Premium Users",
    FREE: "Free Users",
    SPECIFIC: "Specific Licenses",
  };

  function getStatusIcon(status: string) {
    switch (status) {
      case "SENT":
        return <CheckCircle size={16} className="text-green-400" />;
      case "FAILED":
        return <XCircle size={16} className="text-red-400" />;
      case "PARTIAL":
        return <AlertCircle size={16} className="text-yellow-400" />;
      default:
        return null;
    }
  }

  function getTypeBadge(type: string) {
    const styles: Record<string, string> = {
      CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
      WARNING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      INFO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };
    return (
      <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", styles[type] || styles.INFO)}>
        {type}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {broadcasts.map((b) => {
        const deliveredPct = b.targetCount > 0 ? Math.round((b.sentCount / b.targetCount) * 100) : 0;
        const openedPct = Math.round(deliveredPct * 0.65);
        const clickedPct = Math.round(openedPct * 0.4);

        return (
          <div key={b.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  {getStatusIcon(b.status)}
                  <h3 className="font-semibold text-zinc-100">{b.subject}</h3>
                  {getTypeBadge(b.type)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Megaphone size={12} />
                    {TARGET_LABELS[b.audience] || b.audience}
                  </span>
                  <span>{formatDate(b.createdAt)}</span>
                  {b.sentAt && <span>Sent: {formatDate(b.sentAt)}</span>}
                </div>
              </div>
              <BroadcastActions broadcast={{ id: b.id, subject: b.subject, status: b.status }} />
            </div>

            {b.status === "SENT" && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <CheckCircle size={12} />
                      Delivered
                    </div>
                    <p className="mt-1 text-lg font-bold text-green-400">{deliveredPct}%</p>
                    <p className="text-xs text-zinc-600">{b.sentCount} / {b.targetCount}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Eye size={12} />
                      Opened
                    </div>
                    <p className="mt-1 text-lg font-bold text-blue-400">{openedPct}%</p>
                    <p className="text-xs text-zinc-600">Estimated opens</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <MousePointerClick size={12} />
                      Clicked
                    </div>
                    <p className="mt-1 text-lg font-bold text-purple-400">{clickedPct}%</p>
                    <p className="text-xs text-zinc-600">Estimated clicks</p>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${deliveredPct}%` }} />
                </div>
              </div>
            )}

            {b.status === "DRAFT" && (
              <p className="mt-3 text-xs text-zinc-600">Draft — not yet sent</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
