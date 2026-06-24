import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Session Details" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/shared";
import { getSessionFingerprint } from "@/lib/security/fingerprint";
import { Card } from "@/components/ui/Card";
import { Shield, AlertTriangle, Globe, Monitor, Clock, User, Fingerprint, Network, MapPin, Smartphone, Cpu } from "lucide-react";

const riskColors: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-400 border-green-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
};

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3">
      {icon && <div className="mt-0.5 shrink-0 text-zinc-500">{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
        <div className="mt-0.5 text-sm text-zinc-100">{value}</div>
      </div>
    </div>
  );
}

export default async function SessionDetailPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("Manage Sessions");
  const { id } = await props.params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      teamMember: { select: { name: true, email: true, role: { select: { name: true } } } },
    },
  });

  if (!session) notFound();

  const fingerprint = await getSessionFingerprint(id);
  const riskFactors = fingerprint?.riskFactors ? JSON.parse(fingerprint.riskFactors) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Session Details"
        description={`Session ID: ${session.id}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Identity">
          <div className="space-y-2">
            <InfoRow label="Name" value={session.teamMember?.name || "N/A"} icon={<User size={12} />} />
            <InfoRow label="Email" value={session.teamMember?.email || "N/A"} icon={<Network size={12} />} />
            <InfoRow label="Role" value={session.teamMember?.role?.name || "N/A"} icon={<Shield size={12} />} />
          </div>
        </Card>

        <Card title="Session Info">
          <div className="space-y-2">
            <InfoRow label="Status" value={
              session.expiresAt > new Date()
                ? <StatusBadge status="ACTIVE" />
                : <StatusBadge status="EXPIRED" />
            } icon={<Clock size={12} />} />
            <InfoRow label="Created" value={formatDateTime(session.createdAt)} icon={<Clock size={12} />} />
            <InfoRow label="Expires" value={formatDateTime(session.expiresAt)} icon={<Clock size={12} />} />
            <InfoRow label="Token" value={<span className="font-mono text-xs">{session.token.slice(0, 20)}...</span>} icon={<Fingerprint size={12} />} />
          </div>
        </Card>

        <Card title="Risk Assessment">
          {fingerprint ? (
            <div className="space-y-2">
              <InfoRow label="Risk Score" value={
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${riskColors[fingerprint.riskScore] || riskColors.LOW}`}>
                  <AlertTriangle size={10} />
                  {fingerprint.riskScore}
                </span>
              } icon={<Shield size={12} />} />
              <InfoRow label="Suspicious" value={fingerprint.suspicious ? <StatusBadge status="CRITICAL" /> : <StatusBadge status="HEALTHY" />} icon={<AlertTriangle size={12} />} />
              {riskFactors.length > 0 && (
                <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-2">Risk Factors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {riskFactors.map((f: string, i: number) => (
                      <span key={i} className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-zinc-500">No fingerprint data captured.</div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Device Information">
          {fingerprint ? (
            <div className="space-y-2">
              <InfoRow label="Browser" value={`${fingerprint.browser} ${fingerprint.browserVersion}`} icon={<Globe size={12} />} />
              <InfoRow label="Operating System" value={`${fingerprint.os} ${fingerprint.osVersion}`} icon={<Cpu size={12} />} />
              <InfoRow label="Device Type" value={fingerprint.deviceType || "Unknown"} icon={<Smartphone size={12} />} />
              <InfoRow label="Device ID" value={<span className="font-mono text-xs">{fingerprint.deviceId || "N/A"}</span>} icon={<Monitor size={12} />} />
              <InfoRow label="User Agent" value={<span className="break-all font-mono text-[11px] text-zinc-400">{fingerprint.userAgent?.slice(0, 100)}...</span>} icon={<Fingerprint size={12} />} />
            </div>
          ) : (
            <div className="text-sm text-zinc-500">No device data captured.</div>
          )}
        </Card>

        <Card title="Location Information">
          {fingerprint ? (
            <div className="space-y-2">
              <InfoRow label="IP Address" value={<span className="font-mono">{fingerprint.ipAddress || "N/A"}</span>} icon={<Network size={12} />} />
              <InfoRow label="Country" value={fingerprint.countryName || fingerprint.country || "Unknown"} icon={<Globe size={12} />} />
              <InfoRow label="Region" value={fingerprint.region || "Unknown"} icon={<MapPin size={12} />} />
              <InfoRow label="City" value={fingerprint.city || "Unknown"} icon={<MapPin size={12} />} />
              <InfoRow label="ISP" value={fingerprint.isp || "Unknown"} icon={<Network size={12} />} />
            </div>
          ) : (
            <div className="text-sm text-zinc-500">No location data captured.</div>
          )}
        </Card>
      </div>

      <Card title="Fingerprint History">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <InfoRow label="New Device" value={fingerprint?.isNewDevice ? "Yes" : "No"} icon={<Monitor size={12} />} />
          <InfoRow label="New Browser" value={fingerprint?.isNewBrowser ? "Yes" : "No"} icon={<Globe size={12} />} />
          <InfoRow label="New Country" value={fingerprint?.isNewCountry ? "Yes" : "No"} icon={<MapPin size={12} />} />
          <InfoRow label="New Region" value={fingerprint?.isNewRegion ? "Yes" : "No"} icon={<MapPin size={12} />} />
          <InfoRow label="IP Changed" value={fingerprint?.ipChanged ? "Yes" : "No"} icon={<Network size={12} />} />
          <InfoRow label="Device Changed" value={fingerprint?.deviceChanged ? "Yes" : "No"} icon={<Monitor size={12} />} />
        </div>
      </Card>
    </div>
  );
}
