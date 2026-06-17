"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/shared";

interface Note {
  id: string;
  note: string;
  isInternal: boolean;
  createdBy: string | null;
  createdAt: Date;
}

interface TicketNotesProps {
  ticketId: string;
  notes: Note[];
}

export function TicketNotes({ ticketId, notes }: TicketNotesProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function addNote() {
    if (!note.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/support/${ticketId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, isInternal }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error); return; }
      setNote("");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-lg font-bold">Internal Notes ({notes.length})</h2>

      {error && <div className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      <div className="space-y-3 mb-6">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Add an internal note..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-500">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 accent-blue-600"
            />
            Internal only (not visible to user)
          </label>
          <button
            onClick={addNote}
            disabled={loading || !note.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Note"}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-zinc-500">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl bg-zinc-800/50 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-300">{n.createdBy || "System"}</span>
                  {n.isInternal && (
                    <span className="text-xs bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded">Internal</span>
                  )}
                </div>
                <span className="text-xs text-zinc-600">{formatDate(n.createdAt)}</span>
              </div>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{n.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
