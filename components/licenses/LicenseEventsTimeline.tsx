"use client";

import { useState, useEffect } from "react";
import { API_ROUTES } from "@/lib/constants";
import { Circle } from "lucide-react";

interface LicenseEvent {
  id: string;
  type: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

interface Props {
  licenseId: string;
}

const TYPE_STYLES: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  ACTIVATED: { label: "Activated", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", dot: "text-green-400" },
  SUSPENDED: { label: "Suspended", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dot: "text-red-400" },
  REACTIVATED: { label: "Reactivated", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", dot: "text-green-400" },
  EXPIRED: { label: "Expired", color: "text-zinc-400", bg: "bg-zinc-800 border-zinc-700", dot: "text-zinc-500" },
  RENEWED: { label: "Renewed", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", dot: "text-blue-400" },
  TRANSFERRED: { label: "Transferred", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", dot: "text-purple-400" },
  TRIAL_STARTED: { label: "Trial Started", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", dot: "text-yellow-400" },
  TRIAL_CONVERTED: { label: "Trial Converted", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", dot: "text-green-400" },
  FEATURE_UPDATED: { label: "Feature Updated", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", dot: "text-orange-400" },
  VALIDATED: { label: "Validated", color: "text-zinc-400", bg: "bg-zinc-800 border-zinc-700", dot: "text-zinc-500" },
};

function getStyle(type: string) {
  return TYPE_STYLES[type] ?? { label: type, color: "text-zinc-400", bg: "bg-zinc-800 border-zinc-700", dot: "text-zinc-500" };
}

export default function LicenseEventsTimeline({ licenseId }: Props) {
  const [events, setEvents] = useState<LicenseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchEvents() {
      try {
        const response = await fetch(`${API_ROUTES.LICENSES.EVENTS}?licenseId=${licenseId}`);
        const result = await response.json();
        if (!cancelled) {
          if (response.ok) setEvents(result.events ?? result ?? []);
          else setError(result.error || "Failed to load events");
        }
      } catch {
        if (!cancelled) setError("Failed to load events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEvents();
    return () => { cancelled = true; };
  }, [licenseId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-500">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-zinc-900 p-5">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-6 font-semibold">Event Timeline</h3>
      {events.length === 0 ? (
        <p className="text-sm text-zinc-500">No events recorded.</p>
      ) : (
        <div className="relative space-y-0">
          {events.map((event, i) => {
            const style = getStyle(event.type);
            return (
              <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                {i < events.length - 1 && (
                  <div className="absolute left-[11px] top-5 h-full w-px bg-zinc-800" />
                )}
                <div className="mt-0.5 flex-shrink-0">
                  <Circle size={10} className={style.dot} fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(event.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-300">{event.description}</p>
                  {event.performedBy && (
                    <p className="mt-0.5 text-xs text-zinc-500">by {event.performedBy}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
