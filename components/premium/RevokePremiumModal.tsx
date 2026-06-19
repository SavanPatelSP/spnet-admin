"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { daysUntil } from "@/lib/shared";
import { AlertTriangle, Ban, ShieldX } from "lucide-react";

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

interface Props {
  licenseId: string;
  licenseKey?: string;
  organization: string;
  currentPlan: string;
  currentSubscriptionType: string;
  currentExpiry: Date;
  open?: boolean;
  onClose?: () => void;
}

export default function RevokePremiumModal({
  licenseId, licenseKey, organization, currentPlan, currentSubscriptionType, currentExpiry,
  open: externalOpen, onClose: externalOnClose,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    if (!v) externalOnClose?.();
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const remainingDays = daysUntil(new Date(currentExpiry));
  const isExpired = remainingDays < 0;

  async function handleRevoke() {
    if (!acknowledged) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.PREMIUM.REVOKE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, notes: notes || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to revoke premium");
        return;
      }
      setOpen(false);
      setNotes("");
      setAcknowledged(false);
      router.refresh();
    } catch {
      setError("Failed to revoke premium");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {externalOpen === undefined && (
        <ActionButton onClick={() => setOpen(true)} variant="danger" size="sm">
          <Ban size={14} /> Revoke Premium
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Revoke Premium"
        description={`Remove premium status from ${organization}. This action cannot be undone.`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="danger" onClick={handleRevoke} disabled={loading || !acknowledged}>
              {loading ? "Revoking..." : "Revoke Premium"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Current Status */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Current Premium Status</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <div className="text-zinc-500">Organization</div>
              <div className="font-medium text-zinc-100">{organization}</div>
              <div className="text-zinc-500">Plan</div>
              <div><span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-200">{currentPlan}</span></div>
              <div className="text-zinc-500">Type</div>
              <div className="text-zinc-100">{currentSubscriptionType}</div>
              <div className="text-zinc-500">Expiry</div>
              <div className={isExpired ? "text-red-400" : "text-zinc-100"}>{fmt(new Date(currentExpiry))}</div>
              <div className="text-zinc-500">Remaining</div>
              <div className={isExpired ? "text-red-400" : "text-zinc-100"}>{isExpired ? "Expired" : `${remainingDays} days`}</div>
            </div>
          </div>

          {/* Step 2: Impact Analysis */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400">2</span>
              <h4 className="text-sm font-semibold text-red-300">Impact Analysis</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/10 bg-red-500/5 p-3">
                <ShieldX size={16} className="mt-0.5 shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-300">Premium Features Lost</p>
                  <ul className="mt-1.5 space-y-1">
                    <li className="flex items-center gap-2 text-xs text-red-200/70">
                      <span className="h-1 w-1 rounded-full bg-red-400/50" />
                      Plan downgraded from <span className="font-medium text-red-300">{currentPlan}</span> to <span className="font-medium text-red-300">FREE</span>
                    </li>
                    <li className="flex items-center gap-2 text-xs text-red-200/70">
                      <span className="h-1 w-1 rounded-full bg-red-400/50" />
                      Remaining {!isExpired ? `${remainingDays} days of ` : ""}{currentSubscriptionType} term forfeited
                    </li>
                    <li className="flex items-center gap-2 text-xs text-red-200/70">
                      <span className="h-1 w-1 rounded-full bg-red-400/50" />
                      All premium features, devices, and capacity limits reset to FREE tier
                    </li>
                    <li className="flex items-center gap-2 text-xs text-red-200/70">
                      <span className="h-1 w-1 rounded-full bg-red-400/50" />
                      Active premium subscriptions for this license will be terminated
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Reason */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Reason for Revocation</h4>
            </div>
            <textarea
              placeholder="Explain why premium is being revoked..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-red-500"
            />
          </div>

          {/* Step 4: Confirmation */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-300">Irreversible Action</p>
                <p className="text-xs text-red-200/70">
                  Revoking premium will immediately downgrade <strong>{organization}</strong> to the FREE plan.
                  All premium features will be disabled. This action cannot be undone — you will need to re-grant premium
                  to restore access.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-xs text-zinc-400">
                    I understand this is irreversible and confirms revoking premium for {organization}.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Audit Preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex">
                <span className="w-28 text-zinc-500">Action</span>
                <span className="text-red-400">PREMIUM_REVOKED</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">License</span>
                <span className="text-zinc-300">{licenseKey || licenseId}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Organization</span>
                <span className="text-zinc-300">{organization}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">From</span>
                <span className="text-zinc-300">{currentPlan} / {currentSubscriptionType}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">To</span>
                <span className="text-red-400">FREE</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Forfeited</span>
                <span className="text-zinc-300">{!isExpired ? `${remainingDays} days remaining` : "Expired"}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Reason</span>
                <span className="text-zinc-300">{notes || "(not provided)"}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
