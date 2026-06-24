"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTime, parseUA, formatPrice } from "@/lib/shared";
import { cn } from "@/lib/shared";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X, User, Monitor, Smartphone, Globe, Clock, Shield,
  MapPin, Activity, AlertTriangle, ChevronRight, FileText,
  Fingerprint, Network, Terminal, Calendar, Cpu,
  RefreshCw, Crown, LogOut, ArrowUpCircle, Eye, ExternalLink,
} from "lucide-react";

interface SessionRow {
  id: string;
  teamMemberId: string;
  teamMember: { name: string; email: string; role: { name: string } | null } | null;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

interface Props {
  session: SessionRow;
  onClose: () => void;
}

function InfoRow({ label, value, icon, className }: { label: string; value: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3", className)}>
      {icon && <div className="mt-0.5 shrink-0 text-zinc-500">{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
        <div className="mt-0.5 text-sm text-zinc-100">{value}</div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: "green" | "yellow" | "red" | "blue" | "purple" | "zinc" }) {
  const colors: Record<string, string> = {
    green: "bg-green-500/15 text-green-400 border-green-500/25",
    yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    red: "bg-red-500/15 text-red-400 border-red-500/25",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    zinc: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${colors[color] || colors.zinc}`}>
      {label}
    </span>
  );
}

export function SessionDetailDrawer({ session, onClose }: Props) {
  const router = useRouter();
  const [now, setNow] = useState<number>(() => Date.now());
  const [liveExpiresAt, setLiveExpiresAt] = useState(session.expiresAt);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    function onSessionUpdated(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.sessionId === session.id && detail?.expiresAt) {
        setLiveExpiresAt(new Date(detail.expiresAt));
      }
    }
    window.addEventListener("session-updated", onSessionUpdated);
    return () => {
      clearInterval(id);
      window.removeEventListener("session-updated", onSessionUpdated);
    };
  }, [session.id]);

  const parsed = useMemo(() => session.userAgent ? parseUA(session.userAgent) : null, [session.userAgent]);
  const isActive = liveExpiresAt.getTime() > now;

  const remainingSeconds = useMemo(() => Math.max(0, Math.floor((liveExpiresAt.getTime() - now) / 1000)), [liveExpiresAt, now]);

  const remainingLabel = useMemo(() => {
    if (remainingSeconds === 0) return "Expired";
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(" ");
  }, [remainingSeconds]);

  const trustScore = useMemo(() => {
    if (!isActive) return { label: "Inactive", color: "zinc" as const, score: 0 };
    if (parsed?.deviceType === "MOBILE") return { label: "Medium", color: "yellow" as const, score: 65 };
    if (parsed?.browser === "Chrome" || parsed?.browser === "Firefox") return { label: "High", color: "green" as const, score: 85 };
    return { label: "Medium", color: "yellow" as const, score: 60 };
  }, [isActive, parsed]);

  const locationDisplay = useMemo(() => {
    if (!session.ipAddress || session.ipAddress === "127.0.0.1") return "Not Available";
    return session.ipAddress;
  }, [session.ipAddress]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl border-l border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                isActive ? "bg-green-500/15 text-green-400" : "bg-zinc-800 text-zinc-500"
              )}>
                {parsed?.deviceType === "MOBILE" || parsed?.deviceType === "TABLET" ? (
                  <Smartphone size={18} />
                ) : (
                  <Monitor size={18} />
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">Session Details</h2>
                <p className="text-[11px] text-zinc-500">Session ID: {session.id.slice(0, 12)}...</p>
              </div>
              <Link href={`/sessions/${session.id}`} className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                <ExternalLink size={12} />
                Full Details
              </Link>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-5">

              {/* Status */}
              <div className={cn(
                "flex items-center justify-between rounded-xl border p-4",
                isActive ? "border-green-500/20 bg-green-500/5" : "border-zinc-700 bg-zinc-900/50"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", isActive ? "bg-green-500/20" : "bg-zinc-800")}>
                    {isActive ? <Activity size={14} className="text-green-400" /> : <Clock size={14} className="text-zinc-500" />}
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", isActive ? "text-green-300" : "text-zinc-400")}>
                      {isActive ? "Active" : "Expired"}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {isActive ? `${remainingLabel} remaining` : `Expired ${formatDateTime(liveExpiresAt)}`}
                    </p>
                  </div>
                </div>
                <Badge label={trustScore.label} color={trustScore.color} />
              </div>

              {/* Identity */}
              <Section title="Identity" icon={<User size={11} />}>
                <div className="grid grid-cols-2 gap-2">
                  <InfoRow label="Name" value={session.teamMember?.name || "Not Available"} icon={<User size={12} />} />
                  <InfoRow label="Email" value={session.teamMember?.email || "Not Available"} icon={<Terminal size={12} />} />
                </div>
                {session.teamMember?.role?.name && (
                  <InfoRow label="Role" value={<Badge label={session.teamMember.role.name} color={session.teamMember.role.name === "OWNER" ? "red" : session.teamMember.role.name === "SUPER_ADMIN" ? "purple" : "blue"} />} icon={<Shield size={12} />} />
                )}
              </Section>

              {/* Device */}
              <Section title="Device" icon={<Monitor size={11} />}>
                {parsed ? (
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow label="Operating System" value={`${parsed.os} ${parsed.osVersion}`} icon={<Cpu size={12} />} />
                    <InfoRow label="Browser" value={`${parsed.browser} ${parsed.browserVersion}`} icon={<Globe size={12} />} />
                    <InfoRow label="Device Type" value={
                      <Badge label={parsed.deviceType} color={parsed.deviceType === "DESKTOP" ? "blue" : parsed.deviceType === "MOBILE" ? "green" : "purple"} />
                    } icon={<Smartphone size={12} />} />
                    <InfoRow label="User Agent" value={<span className="break-all font-mono text-[11px] text-zinc-400">{session.userAgent?.slice(0, 80)}...</span>} icon={<Fingerprint size={12} />} />
                  </div>
                ) : (
                  <InfoRow label="Device Info" value="Not Available" icon={<Monitor size={12} />} />
                )}
              </Section>

              {/* Location */}
              <Section title="Location" icon={<MapPin size={11} />}>
                <div className="grid grid-cols-2 gap-2">
                  <InfoRow label="IP Address" value={<span className="font-mono">{session.ipAddress || "Not Available"}</span>} icon={<Network size={12} />} />
                  <InfoRow label="Country" value="Not Available" icon={<Globe size={12} />} />
                  <InfoRow label="City" value="Not Available" icon={<MapPin size={12} />} />
                  <InfoRow label="ISP" value="Not Available" icon={<Network size={12} />} />
                </div>
              </Section>

              {/* Activity */}
              <Section title="Activity" icon={<Activity size={11} />}>
                <div className="grid grid-cols-2 gap-2">
                  <InfoRow label="Created" value={formatDateTime(session.createdAt)} icon={<Calendar size={12} />} />
                  <InfoRow label="Expires" value={formatDateTime(liveExpiresAt)} icon={<Clock size={12} />} />
                  <InfoRow label="Remaining" value={
                    <span className={cn(isActive ? "text-green-400" : "text-red-400")}>{isActive ? remainingLabel : "Expired"}</span>
                  } icon={<Clock size={12} />} />
                  <InfoRow label="Status" value={<Badge label={isActive ? "Active" : "Expired"} color={isActive ? "green" : "zinc"} />} icon={<Activity size={12} />} />
                </div>
              </Section>

              {/* Security */}
              <Section title="Security" icon={<Shield size={11} />}>
                <div className="grid grid-cols-2 gap-2">
                  <InfoRow label="Trust Score" value={`${trustScore.score}/100`} icon={<Shield size={12} />} />
                  <InfoRow label="Risk Level" value={
                    <Badge label={trustScore.score >= 80 ? "Low" : trustScore.score >= 50 ? "Medium" : "High"} color={trustScore.score >= 80 ? "green" : trustScore.score >= 50 ? "yellow" : "red"} />
                  } icon={<AlertTriangle size={12} />} />
                  <InfoRow label="MFA Status" value="Not Available" icon={<Shield size={12} />} />
                  <InfoRow label="Session Token" value={<span className="font-mono text-[11px]">{session.token.slice(0, 16)}...</span>} icon={<Key size={12} />} />
                </div>
              </Section>

              {/* Quick Actions */}
              <Section title="Quick Actions" icon={<Activity size={11} />}>
                <div className="flex flex-wrap gap-2">
                  {isActive && (
                    <button
                      onClick={() => { onClose(); }}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                    >
                      <ArrowUpCircle size={12} /> Extend
                    </button>
                  )}
                  <button
                    onClick={() => { onClose(); }}
                    className="flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/20"
                  >
                    <Crown size={12} /> Override
                  </button>
                  <button
                    onClick={() => { onClose(); }}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    <LogOut size={12} /> Force Logout
                  </button>
                  <button
                    onClick={() => { router.refresh(); }}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700"
                  >
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
              </Section>

            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-800 px-5 py-3">
            <div className="flex items-center gap-2 text-[10px] text-zinc-600">
              <FileText size={10} />
              Session data captured at login. Device metadata via User-Agent parsing.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Key(props: { size?: number }) {
  return <svg width={props.size || 12} height={props.size || 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4a5 5 0 1 1-3.12 8.85L8 15l-2-2 2.15-2.15A5 5 0 0 1 15 4z"/><line x1="8" y1="15" x2="6" y2="17"/><line x1="10" y1="17" x2="8" y2="19"/></svg>;
}
