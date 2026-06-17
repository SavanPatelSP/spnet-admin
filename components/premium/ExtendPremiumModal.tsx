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
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Additional Days</label>
            <input
              type="number"
              min="1"
              max="36500"
              value={additionalDays}
              onChange={(e) => setAdditionalDays(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Notes (optional)</label>
            <textarea
              placeholder="Reason for extension..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
