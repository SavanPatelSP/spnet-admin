"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2, FileEdit } from "lucide-react";

interface Broadcast {
  id: string;
  subject: string;
  status: string;
}

export function BroadcastActions({ broadcast }: { broadcast: Broadcast }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function send() {
    setLoading("send");
    try {
      const res = await fetch(`/api/broadcasts/${broadcast.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to send");
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${broadcast.subject}"?`)) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/broadcasts/${broadcast.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  }

  const canSend = broadcast.status === "DRAFT";
  const canDelete = broadcast.status !== "SENT";

  return (
    <div className="flex items-center gap-2">
      {canSend && (
        <button
          onClick={send}
          disabled={loading === "send"}
          className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-green-400 disabled:opacity-30"
          title="Send now"
        >
          <Send size={14} />
        </button>
      )}
      {broadcast.status === "DRAFT" && (
        <button
          className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-blue-400 disabled:opacity-30"
          title="Edit"
        >
          <FileEdit size={14} />
        </button>
      )}
      {canDelete && (
        <button
          onClick={remove}
          disabled={loading === "delete"}
          className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-30"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
