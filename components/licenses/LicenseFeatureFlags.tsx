"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { ToggleLeft, Plus, Save, Trash2 } from "lucide-react";

interface FlagEntry {
  key: string;
  value: string;
}

interface Props {
  licenseId: string;
  initialFlags?: Record<string, boolean | string | number>;
}

export default function LicenseFeatureFlags({ licenseId, initialFlags = {} }: Props) {
  const router = useRouter();
  const [flags, setFlags] = useState<FlagEntry[]>(() =>
    Object.entries(initialFlags).map(([key, value]) => ({ key, value: String(value) }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addFlag() {
    setFlags((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeFlag(index: number) {
    setFlags((prev) => prev.filter((_, i) => i !== index));
  }

  function updateFlag(index: number, field: "key" | "value", val: string) {
    setFlags((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: val } : f)));
  }

  async function save() {
    setError("");
    const parsed: Record<string, string> = {};
    for (const f of flags) {
      if (!f.key.trim()) {
        setError("All flag keys must be non-empty");
        return;
      }
      parsed[f.key.trim()] = f.value;
    }
    setSaving(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.FEATURE_FLAGS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, flags: parsed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to save feature flags");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to save feature flags");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ToggleLeft size={18} className="text-blue-400" />
          <h3 className="font-semibold">Feature Flags</h3>
        </div>
        <div className="flex gap-2">
          <ActionButton onClick={addFlag} variant="ghost" size="sm">
            <Plus size={14} /> Add Flag
          </ActionButton>
          <ActionButton onClick={save} variant="primary" size="sm" loading={saving}>
            <Save size={14} /> Save
          </ActionButton>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      )}

      {flags.length === 0 ? (
        <p className="text-sm text-zinc-500">No feature flags defined.</p>
      ) : (
        <div className="space-y-2">
          {flags.map((flag, i) => (
            <div key={flag.key || i} className="flex items-center gap-2">
              <input
                value={flag.key}
                onChange={(e) => updateFlag(i, "key", e.target.value)}
                placeholder="Flag key"
                className="w-1/3 rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
              <input
                value={flag.value}
                onChange={(e) => updateFlag(i, "value", e.target.value)}
                placeholder="Value"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
              <button
                onClick={() => removeFlag(i)}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
