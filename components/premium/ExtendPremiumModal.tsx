"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";

interface ExtendPremiumModalProps {
  licenseId: string;
  organization: string;
  open?: boolean;
  onClose?: () => void;
}

const PRESET_DAYS = [
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
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

export default function ExtendPremiumModal({ licenseId, organization, open: externalOpen, onClose: externalOnClose }: ExtendPremiumModalProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    if (!v) externalOnClose?.();
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [additionalDays, setAdditionalDays] = useState(365);
  const [notes, setNotes] = useState("");

  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + additionalDays);

  async function handleExtend() {
    setError("");
    if (additionalDays < 1) {
      setError("Additional days must be at least 1");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.PREMIUM.EXTEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, additionalDays, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to extend premium");
        return;
      }
      setOpen(false);
      setAdditionalDays(365);
      setNotes("");
      router.refresh();
    } catch {
      setError("Failed to extend premium");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {externalOpen === undefined && (
        <ActionButton onClick={() => setOpen(true)} variant="secondary" size="sm">
          Extend
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Extend Premium"
        description={`Extend premium subscription for ${organization}.`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleExtend} disabled={loading}>
              {loading ? "Extending..." : "Extend"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Current Subscription */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Current Subscription</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="text-zinc-500">Organization</div>
              <div className="font-medium text-zinc-100">{organization}</div>
              <div className="text-zinc-500">License ID</div>
              <code className="text-zinc-300">{licenseId}</code>
              <div className="text-zinc-500">Status</div>
              <div>
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                  Active
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
                {PRESET_DAYS.map((preset) => (
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

          {/* Step 3: Reason & Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Reason & Notes</h4>
            </div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Notes (optional)</label>
            <textarea
              placeholder="Reason for extension..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>

          {/* Audit Preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex">
                <span className="w-24 text-zinc-500">Action</span>
                <span className="text-yellow-400">EXTEND_PREMIUM</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">License</span>
                <span className="text-zinc-300">{licenseId}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Organization</span>
                <span className="text-zinc-300">{organization}</span>
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
    </>
  );
}
