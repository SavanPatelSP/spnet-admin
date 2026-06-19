"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { CheckCircle, XCircle } from "lucide-react";

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

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

export default function BulkExtendModal({ licenseIds, onClose }: BulkExtendModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [additionalDays, setAdditionalDays] = useState(90);
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<{ licenseId: string; ok: boolean; error?: string }[]>([]);

  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + additionalDays);

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
      size="lg"
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
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Step 1: Overview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">Overview</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="text-zinc-500">Licenses Selected</div>
            <div className="font-medium text-zinc-100">{licenseIds.length}</div>
            <div className="text-zinc-500">Operation</div>
            <div>
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                Bulk Extend
              </span>
            </div>
          </div>
        </div>

        {/* Step 2: Extension Duration */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
            <h4 className="text-sm font-semibold text-zinc-100">Extension Duration</h4>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Preset Duration</label>
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
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
            <div className="text-xs text-zinc-400">
              New expiry: <span className="font-medium text-zinc-200">{fmt(newExpiry)}</span> ({(additionalDays > 0) ? `+${additionalDays} days` : "today"})
            </div>
          </div>
        </div>

        {/* Step 3: Notes */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
            <h4 className="text-sm font-semibold text-zinc-100">Notes</h4>
          </div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Notes (optional)</label>
          <textarea
            placeholder="Reason for bulk extension..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              {failed === 0 ? (
                <CheckCircle size={14} className="text-green-400" />
              ) : succeeded > 0 ? (
                <CheckCircle size={14} className="text-yellow-400" />
              ) : (
                <XCircle size={14} className="text-red-400" />
              )}
              <h4 className="text-sm font-semibold text-zinc-100">Results</h4>
              <span className="ml-auto text-xs text-zinc-500">
                {succeeded} succeeded, {failed} failed
              </span>
            </div>
            {failed > 0 && (
              <div className="space-y-1.5">
                {results.filter((r) => !r.ok).map((r) => (
                  <div key={r.licenseId} className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs">
                    <XCircle size={12} className="shrink-0 text-red-400" />
                    <code className="text-red-300">{r.licenseId}</code>
                    <span className="text-red-400">{r.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Audit Preview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex">
              <span className="w-24 text-zinc-500">Action</span>
              <span className="text-yellow-400">BULK_EXTEND_PREMIUM</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Licenses</span>
              <span className="text-zinc-300">{licenseIds.length} license(s)</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Extension</span>
              <span className="text-zinc-300">{additionalDays} days</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">New Expiry</span>
              <span className="text-green-400">{fmt(newExpiry)}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500">Notes</span>
              <span className="text-zinc-300">{notes || <span className="text-zinc-600">(not set)</span>}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
