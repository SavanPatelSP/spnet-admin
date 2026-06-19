"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2, FileEdit } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Broadcast {
  id: string;
  subject: string;
  status: string;
}

export function BroadcastActions({ broadcast }: { broadcast: Broadcast }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
      // send errors are silent as they don't affect data
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/broadcasts/${broadcast.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete");
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    } catch {
      setDeleteError("Network error");
    } finally {
      setDeleteLoading(false);
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
          aria-label="Send broadcast"
        >
          <Send size={14} />
        </button>
      )}
      {broadcast.status === "DRAFT" && (
        <button
          className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-blue-400 disabled:opacity-30"
          title="Edit"
          aria-label="Edit broadcast"
        >
          <FileEdit size={14} />
        </button>
      )}
      {canDelete && (
        <>
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={loading === "delete"}
            className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-30"
            title="Delete"
            aria-label="Delete broadcast"
          >
            <Trash2 size={14} />
          </button>

          <ConfirmDialog
            open={deleteOpen}
            onClose={() => { setDeleteOpen(false); setDeleteError(""); }}
            onConfirm={remove}
            title="Delete Broadcast"
            description={`Delete "${broadcast.subject}"? This action cannot be undone.`}
            confirmLabel="Delete"
            variant="danger"
            loading={deleteLoading}
            error={deleteError}
          />
        </>
      )}
    </div>
  );
}
