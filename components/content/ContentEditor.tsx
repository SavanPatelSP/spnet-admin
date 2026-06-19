"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkflowBadge } from "./WorkflowBadge";
import { WORKFLOW_LABELS } from "@/lib/content";
import type { ContentItem, WorkflowState } from "@/lib/content";
import { formatDateTime } from "@/lib/shared";

const CATEGORIES = ["General", "Announcement", "Documentation", "Tutorial", "Release Notes", "Policy"];

interface ContentEditorProps {
  item?: ContentItem | null;
  isNew?: boolean;
}

export function ContentEditor({ item, isNew }: ContentEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(item?.title || "");
  const [body, setBody] = useState(item?.body || "");
  const [category, setCategory] = useState(item?.category || "General");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save(asAction?: string) {
    setError("");
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required");
      return;
    }
    setLoading(true);
    try {
      if (isNew) {
        const res = await fetch("/api/content/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, category }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(json.error || "Failed to create");
          return;
        }
        if (asAction) {
          await fetch(`/api/content/${json.data.id}/${asAction}`, { method: "POST" });
        }
        router.push("/content");
        router.refresh();
      } else if (item) {
        const res = await fetch(`/api/content/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, category }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(json.error || "Failed to save");
          return;
        }
        if (asAction) {
          await fetch(`/api/content/${item.id}/${asAction}`, { method: "POST" });
        }
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function can(action: string): boolean {
    if (!item) return action === "review";
    const transitions: Record<WorkflowState, string[]> = {
      DRAFT: ["review"],
      IN_REVIEW: ["publish"],
      PUBLISHED: [],
      ARCHIVED: ["draft"],
    };
    return (transitions[item.status] || []).includes(action);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}

      {!isNew && item && (
        <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">Status:</span>
            <WorkflowBadge status={item.status} />
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-sm text-zinc-500">Version {item.version}</span>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-sm text-zinc-500">Last modified: {formatDateTime(item.updatedAt)}</span>
          {item.publishedAt && (
            <>
              <div className="h-4 w-px bg-zinc-800" />
              <span className="text-sm text-zinc-500">Published: {formatDateTime(item.publishedAt)}</span>
            </>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-zinc-500">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Content title"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-zinc-500">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-500">Content Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          placeholder="Write your content here..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => save()}
          disabled={loading}
          className="rounded-xl bg-zinc-800 px-5 py-3 font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Draft"}
        </button>

        {isNew && (
          <button
            onClick={() => save("review")}
            disabled={loading}
            className="rounded-xl bg-yellow-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-yellow-500 disabled:opacity-50"
          >
            Save & Submit for Review
          </button>
        )}

        {!isNew && can("review") && (
          <button
            onClick={() => save("review")}
            disabled={loading}
            className="rounded-xl bg-yellow-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-yellow-500 disabled:opacity-50"
          >
            Submit for Review
          </button>
        )}

        {!isNew && can("publish") && (
          <button
            onClick={() => save("publish")}
            disabled={loading}
            className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-green-500 disabled:opacity-50"
          >
            Publish
          </button>
        )}

        {!isNew && can("draft") && (
          <button
            onClick={() => save("draft")}
            disabled={loading}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            Send Back to Draft
          </button>
        )}
      </div>
    </div>
  );
}
