"use client";

import { useState } from "react";
import { User, Lock, Activity, Bell, Settings, Shield, Mail, CalendarDays, Tag, Building2, LogOut } from "lucide-react";
import { formatDateTime } from "@/lib/dates";
import { signOut } from "next-auth/react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

type Tab = "overview" | "account" | "security" | "sessions" | "notifications" | "preferences";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <User size={16} /> },
  { key: "account", label: "Account", icon: <Settings size={16} /> },
  { key: "security", label: "Security", icon: <Shield size={16} /> },
  { key: "sessions", label: "Sessions", icon: <Activity size={16} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { key: "preferences", label: "Preferences", icon: <Settings size={16} /> },
];

interface ProfileMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: { id: string; name: string };
  createdAt: string;
  lastLogin: string | null;
  status: string;
}

export function ProfileCenter({ member }: { member: ProfileMember }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const initials = member.name?.slice(0, 2).toUpperCase() || "??";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="lg:w-64 shrink-0">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-4 flex flex-col items-center gap-3 pb-4 border-b border-zinc-800">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
              {initials}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-100">{member.name}</p>
              <p className="text-xs text-zinc-500">{member.email}</p>
            </div>
            <div>
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">{member.role.name}</span>
            </div>
          </div>

          <nav className="space-y-1">
            {TABS.map(({ key, label, icon }) => {
              const active = activeTab === key;
              return (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-zinc-800 pt-4">
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-zinc-800">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {activeTab === "overview" && <OverviewTab member={member} />}
        {activeTab === "account" && <AccountTab member={member} />}
        {activeTab === "security" && <SecurityTab member={member} />}
        {activeTab === "sessions" && <SessionsTab memberId={member.id} />}
        {activeTab === "notifications" && <NotificationsTab memberId={member.id} />}
        {activeTab === "preferences" && <PreferencesTab />}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-6 py-4">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string | React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/50 py-3 last:border-0">
      <span className="flex items-center gap-2 text-sm text-zinc-400">
        {icon} {label}
      </span>
      <span className="text-sm font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function OverviewTab({ member }: { member: ProfileMember }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Account Overview">
        <InfoRow label="Name" value={member.name} icon={<User size={14} />} />
        <InfoRow label="Email" value={member.email} icon={<Mail size={14} />} />
        <InfoRow label="Role" value={member.role.name} icon={<Tag size={14} />} />

        <InfoRow label="Status" value={member.status} icon={<Activity size={14} />} />
        <InfoRow label="Member since" value={formatDateTime(member.createdAt)} icon={<CalendarDays size={14} />} />
        <InfoRow label="Last login" value={member.lastLogin ? formatDateTime(member.lastLogin) : "N/A"} icon={<Activity size={14} />} />
      </SectionCard>
    </div>
  );
}

function AccountTab({ member }: { member: ProfileMember }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Account Details">
        <InfoRow label="Member ID" value={member.id} />
        <InfoRow label="Name" value={member.name} />
        <InfoRow label="Email" value={member.email} />
      </SectionCard>
    </div>
  );
}

function SecurityTab({ member }: { member: ProfileMember }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Security Information">
        <p className="text-sm text-zinc-500">
          Security settings and activity logs for your account.
        </p>
      </SectionCard>
    </div>
  );
}

function SessionsTab({ memberId }: { memberId: string }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Active Sessions">
        <p className="text-sm text-zinc-500">
          Your active sessions across devices and browsers.
        </p>
      </SectionCard>
    </div>
  );
}

function NotificationsTab({ memberId }: { memberId: string }) {
  return <NotificationCenter memberId={memberId} initialUnread={0} initialTotal={0} />;
}

function PreferencesTab() {
  return (
    <div className="space-y-6">
      <SectionCard title="Preferences">
        <p className="text-sm text-zinc-500">
          Configure your notification preferences and display settings.
        </p>
      </SectionCard>
    </div>
  );
}
