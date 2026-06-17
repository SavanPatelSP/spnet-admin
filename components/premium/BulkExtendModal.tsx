"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";

interface BulkExtendModalProps {
  licenseIds: string[];
  onClose: () => void;
}

const PRESET_EXTENDS = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "180 days", days: 180 },
  { label: "1 year", days: 365 },
];

export default function BulkExtendModal({ licenseIds, onClose }: BulkExtendModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [additionalDays, setAdditionalDays] = useState(90);
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<{ licenseId: string; ok: boolean; error?: string }[]>([]);

  async function handleExtend() {
    if (additionalDays < 1) {
      setError("Duration must be at least 1 day");
      return;
    }
    setError("");
    setLoading(true);
    setResults([]);

    const batchResults: { licenseId: string; ok: boolean; error?: string }[] = [];

    for (const licenseId of licenseIds) {
      try {
        const res = await fetch("/api/premium/extend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ licenseId, additionalDays, notes: notes || null }),
        });
        const data = await res.json();
        batchResults.push({ licenseId, ok: res.ok, error: res.ok ? undefined : data.error });
      } catch {
        batchResults.push({ licenseId, ok: false, error: "Network error" });
      }
    }

    setResults(batchResults);

    const allOk = batchResults.every((r) => r.ok);
    if (allOk) {
      onClose();
      router.refresh();
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return (
    <Modal
      open
      onClose={onClose}
      title="Bulk Extend Premium"
      description={`Extend premium for ${licenseIds.length} license(s)`}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleExtend} disabled={loading}>
            {loading
              ? `Extending (${succeeded + failed}/${licenseIds.length})...`
              : `Extend ${licenseIds.length} License(s)`}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {results.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="mb-2 text-xs font-medium text-zinc-400">
              Results: {succeeded} succeeded, {failed} failed
            </div>
            {results.filter((r) => !r.ok).map((r) => (
              <div key={r.licenseId} className="text-xs text-red-400">
                {r.licenseId}: {r.error}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {PRESET_EXTENDS.map((preset) => (
            <button
              key={preset.days}
              type="button"
              onClick={() => setAdditionalDays(preset.days)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                additionalDays === preset.days
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                  : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Custom Duration (days)</label>
          <input
            type="number"
            min="1"
            max="36500"
            value={additionalDays}
            onChange={(e) => setAdditionalDays(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Notes (optional)</label>
          <textarea
            placeholder="Reason for bulk extension..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}
