"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { CheckCircle, Bell } from "lucide-react";

interface BulkConvertLifetimeModalProps {
  licenseIds: string[];
  onClose: () => void;
}

const CONVERSION_REASONS = [
  "Customer Loyalty Program",
  "Founders Special",
  "Enterprise Agreement",
  "Executive Decision",
  "Bug Bounty / Contribution",
  "Strategic Partnership",
  "Other",
];

const LIFETIME_BENEFITS = [
  "Never expires — one-time conversion",
  "No renewal reminders or billing",
  "Full plan features permanently unlocked",
  "Priority support for lifetime members",
];

export default function BulkConvertLifetimeModal({ licenseIds, onClose }: BulkConvertLifetimeModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);
  const [results, setResults] = useState<{ licenseId: string; ok: boolean; error?: string }[]>([]);

  async function handleConvert() {
    if (!reason) {
      setError("Please select a conversion reason");
      return;
    }
    if (!acknowledged) {
      setError("Please acknowledge the irreversible nature of this conversion");
      return;
    }
    setError("");
    setLoading(true);
    setResults([]);

    const batchResults: { licenseId: string; ok: boolean; error?: string }[] = [];

    for (const licenseId of licenseIds) {
      try {
        const res = await fetch("/api/premium/convert-lifetime", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            licenseId,
            notes: [reason, notes, notifyUser ? "Notify user requested" : ""].filter(Boolean).join(" | ") || null,
          }),
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
      title="Bulk Convert to Lifetime"
      description={`Convert ${licenseIds.length} premium license(s) to lifetime`}
      size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleConvert} disabled={loading}>
            {loading
              ? `Converting (${succeeded + failed}/${licenseIds.length})...`
              : `Convert ${licenseIds.length} License(s)`}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {results.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="mb-2 text-xs font-medium text-zinc-400">
              Results: {succeeded} converted, {failed} failed
            </div>
            {results.filter((r) => !r.ok).map((r) => (
              <div key={r.licenseId} className="text-xs text-red-400">
                {r.licenseId}: {r.error}
              </div>
            ))}
          </div>
        )}

        {/* Benefits */}
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
          <div className="mb-2 text-xs font-semibold text-purple-300">Benefits of Lifetime Conversion</div>
          <div className="space-y-1">
            {LIFETIME_BENEFITS.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-purple-100">
                <CheckCircle size={12} className="shrink-0 text-purple-400" />
                {b}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Conversion Reason <span className="text-red-400">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
          >
            <option value="">Select a reason...</option>
            {CONVERSION_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Notes (optional)</label>
          <textarea
            placeholder="Additional context for audit trail..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={notifyUser}
              onChange={(e) => setNotifyUser(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-5 w-9 rounded-full bg-zinc-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-zinc-400 after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
          </label>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Bell size={12} />
            Notify users about lifetime conversion
          </span>
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs text-red-300">
            This is a <strong>permanent, irreversible</strong> conversion for all {licenseIds.length} selected license(s).
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-xs text-zinc-400">
            I acknowledge this is a permanent, irreversible conversion for all selected licenses.
          </span>
        </label>
      </div>
    </Modal>
  );
}
