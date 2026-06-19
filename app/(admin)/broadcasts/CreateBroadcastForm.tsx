"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Info, Users, Crown, Building2, UserCheck, KeyRound, Eye, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface TargetInfo {
  label: string;
  count: number;
  description: string;
}

const TARGET_OPTIONS: { value: string; label: string; icon: LucideIcon; description: string }[] = [
  { value: "ALL", label: "All Users", icon: Users, description: "Every registered user in the system" },
  { value: "PREMIUM", label: "Premium Users", icon: Crown, description: "Users with active premium subscriptions" },
  { value: "ORGANIZATIONS", label: "Organizations", icon: Building2, description: "All organization members" },
  { value: "TEAM", label: "Team Members", icon: UserCheck, description: "Internal team members only" },
  { value: "LICENSE_HOLDERS", label: "License Holders", icon: KeyRound, description: "Users with active license activations" },
];

const MAX_TARGET = 10000;

export function CreateBroadcastForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [audience, setAudience] = useState("ALL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [targets, setTargets] = useState<Record<string, TargetInfo>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/broadcast/targets")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setTargets(j.data);
      })
      .catch(() => {});
  }, []);

  const selectedTarget = targets[audience];
  const currentCount = selectedTarget?.count || 0;
  const reachPercent = Math.min(100, Math.round((currentCount / MAX_TARGET) * 100));

  async function handleSubmit(saveAsDraft: boolean) {
    setError("");
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }
    if (!saveAsDraft && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          type,
          audience,
          scheduledAt: saveAsDraft ? null : scheduledAt || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to create broadcast");
        return;
      }
      if (!saveAsDraft && json.data?.status === "DRAFT" && json.data?.id) {
        const sendRes = await fetch(`/api/broadcasts/${json.data.id}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledAt: scheduledAt || null }),
        });
        const sendJson = await sendRes.json();
        if (!sendJson.success) {
          setError(sendJson.error || "Broadcast saved but failed to send");
          return;
        }
      }
      setSubject("");
      setMessage("");
      setScheduledAt("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm text-zinc-500">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          >
            <option value="INFO">Information</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-zinc-500">Schedule (optional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-500">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Broadcast subject"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-500">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Message content..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <label className="text-sm text-zinc-500">Broadcast Target</label>
          <div className="group relative">
            <Info size={14} className="text-zinc-600 cursor-help" />
            <div className="absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-400 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              Choose the audience you want to reach. The recipient count shows how many users will receive this broadcast.
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {TARGET_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const count = targets[opt.value]?.count;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAudience(opt.value)}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                  audience === opt.value
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                }`}
              >
                <Icon size={24} className={audience === opt.value ? "text-blue-400" : "text-zinc-400"} />
                <span className={`text-xs font-medium ${audience === opt.value ? "text-blue-300" : "text-zinc-300"}`}>
                  {opt.label}
                </span>
                {count !== undefined && (
                  <span className="text-xs text-zinc-500">{count.toLocaleString()}</span>
                )}
                <div className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-400 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                  {opt.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedTarget && (
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-zinc-300">Estimated Reach</span>
            </div>
            <span className="text-sm text-zinc-400">
              <strong className="text-zinc-200">{currentCount.toLocaleString()}</strong> recipients
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${reachPercent}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600">
            {selectedTarget.description} · Up to {currentCount.toLocaleString()} users
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-5">
        <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500">
          <Eye size={16} />
          Delivery Preview
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4">
          <div className="flex items-center gap-3 border-b border-zinc-700 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
              <Megaphone size={16} className="text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-400">
                System Broadcast
                {type === "CRITICAL" && <span className="ml-2 text-red-400">· Critical</span>}
                {type === "WARNING" && <span className="ml-2 text-yellow-400">· Warning</span>}
              </p>
              <p className="text-sm font-semibold text-zinc-100 truncate">{subject || "Broadcast Subject"}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-300 line-clamp-3">{message || "Message content will appear here..."}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Sending..." : scheduledAt ? "Schedule Broadcast" : "Send Broadcast"}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="rounded-xl bg-zinc-800 px-5 py-3 font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          Save as Draft
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
                <Megaphone size={32} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Send Broadcast</h3>
              <p className="mt-2 text-sm text-zinc-400">
                This will send <strong className="text-zinc-200">"{subject}"</strong> to{' '}
                <strong className="text-zinc-200">{currentCount.toLocaleString()}</strong>{' '}
                {TARGET_OPTIONS.find((o) => o.value === audience)?.label || "recipients"}.
              </p>
              <p className="mt-1 text-xs text-zinc-600">This action cannot be undone.</p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Confirm Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
