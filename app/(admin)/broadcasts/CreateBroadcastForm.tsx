"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateBroadcastForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [audience, setAudience] = useState("ALL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(saveAsDraft: boolean) {
    setError("");
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }
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
      if (!saveAsDraft && json.data.status === "DRAFT") {
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
    <div className="space-y-4">
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
          <label className="mb-1.5 block text-sm text-zinc-500">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          >
            <option value="ALL">All Users</option>
            <option value="PREMIUM">Premium Only</option>
            <option value="FREE">Free Only</option>
            <option value="SPECIFIC">Specific Licenses</option>
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
    </div>
  );
}
