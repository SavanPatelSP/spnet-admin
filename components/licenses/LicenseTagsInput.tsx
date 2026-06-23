"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES } from "@/lib/constants";
import { Tag, Plus, X } from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  color: string;
}

interface Props {
  licenseId: string;
  initialTags?: TagItem[];
}

const TAG_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

export default function LicenseTagsInput({ licenseId, initialTags = [] }: Props) {
  const { hasPermission } = usePermission();
  const router = useRouter();
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function addTag() {
    const name = newName.trim();
    if (!name) return;
    setError("");
    setAdding(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.TAGS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, name, color: newColor }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to add tag");
        return;
      }
      setTags((prev) => [...prev, { id: data.id ?? crypto.randomUUID(), name, color: newColor }]);
      setNewName("");
      setNewColor(TAG_COLORS[0]);
      router.refresh();
    } catch {
      setError("Failed to add tag");
    } finally {
      setAdding(false);
    }
  }

  async function removeTag(tagId: string) {
    setError("");
    try {
      const response = await fetch(API_ROUTES.LICENSES.TAGS, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, tagId }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to remove tag");
        return;
      }
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      router.refresh();
    } catch {
      setError("Failed to remove tag");
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Tag size={18} className="text-purple-400" />
        <h3 className="font-semibold">Tags</h3>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: t.color }}
          >
            {t.name}
            {hasPermission("Manage License Tags") && (
              <button onClick={() => removeTag(t.id)} className="ml-0.5 rounded-full p-0.5 hover:bg-white/20">
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {tags.length === 0 && <span className="text-sm text-zinc-500">No tags added.</span>}
      </div>

      {hasPermission("Manage License Tags") && (
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
            onKeyDown={(e) => { if (e.key === "Enter") addTag(); }}
          />
          <div className="flex gap-1">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition-all ${newColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <ActionButton onClick={addTag} variant="ghost" size="sm" loading={adding}>
            <Plus size={14} />
          </ActionButton>
        </div>
      )}
    </div>
  );
}
