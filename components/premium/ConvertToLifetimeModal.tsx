"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { daysUntil } from "@/lib/shared";
import { Crown, History, Bell, CheckCircle, Infinity } from "lucide-react";

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
  "Future plan upgrades at no additional term cost",
];

interface HistoryEntry {
  id: string;
  action: string;
  plan: string;
  subscriptionType: string;
  durationDays: number | null;
  startDate: string;
  endDate: string | null;
  grantedBy: string | null;
  notes: string | null;
  createdAt: string;
  license: { organization: string; key: string; plan: string; status: string };
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

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

function toDateInput(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function ConvertToLifetimeModal({
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
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [notifyUser, setNotifyUser] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHistoryLoading(true);
    fetch(`/api/premium/history?licenseId=${licenseId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [open, licenseId]);

  const remainingDays = daysUntil(new Date(currentExpiry));
  const isExpired = remainingDays < 0;
  const valid = reason.trim().length > 0 && acknowledged;

  async function handleConvert() {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.PREMIUM.CONVERT_LIFETIME, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseId,
          notes: [reason, notes, notifyUser ? "Notify user requested" : ""].filter(Boolean).join(" | ") || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to convert to lifetime");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to convert to lifetime");
    } finally {
      setLoading(false);
    }
  }

  const expiryBarPct = Math.min(Math.max(remainingDays / 365, 0.05), 1) * 100;

  return (
    <>
      {externalOpen === undefined && (
        <ActionButton onClick={() => setOpen(true)} variant="primary" size="sm">
          Convert to Lifetime
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Convert to Lifetime"
        description="Permanently activate a lifetime subscription."
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleConvert} disabled={loading || !valid}>
              {loading ? "Converting..." : "Confirm Lifetime Conversion"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Review Current Subscription */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Review Current Subscription</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="text-zinc-500">Organization</div>
              <div className="font-medium text-zinc-100">{organization}</div>
              <div className="text-zinc-500">License Key</div>
              <code className="text-zinc-300">{licenseKey || licenseId}</code>
              <div className="text-zinc-500">Plan</div>
              <div><span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-200">{currentPlan}</span></div>
              <div className="text-zinc-500">Type</div>
              <div className="text-zinc-100">{currentSubscriptionType}</div>
              <div className="text-zinc-500">Current Expiry</div>
              <div className={isExpired ? "text-red-400" : "text-zinc-100"}>{fmt(new Date(currentExpiry))}</div>
              <div className="text-zinc-500">Remaining</div>
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-full max-w-32 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${isExpired ? "bg-red-500" : "bg-yellow-500"}`}
                      style={{ width: `${isExpired ? 0 : expiryBarPct}%` }}
                    />
                  </div>
                  <span className={isExpired ? "text-sm text-red-400" : "text-sm text-zinc-200"}>
                    {isExpired ? "Expired" : `${remainingDays} days`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Benefits */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-700 text-xs font-bold text-purple-200">2</span>
              <h4 className="text-sm font-semibold text-purple-200">Benefits of Lifetime Conversion</h4>
            </div>
            <div className="space-y-2">
              {LIFETIME_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle size={14} className="mt-0.5 shrink-0 text-purple-400" />
                  <span className="text-sm text-purple-100">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Conversion Impact */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Conversion Impact</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="mb-2 text-xs font-medium text-zinc-500">Before</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Plan</span><span className="text-zinc-300">{currentPlan}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Type</span><span className="text-zinc-300">{currentSubscriptionType}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Expiry</span><span className="text-zinc-300">{fmt(new Date(currentExpiry))}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Duration</span><span className="text-zinc-300">Term-based</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                <div className="mb-2 text-xs font-medium text-purple-400">After</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Plan</span><span className="text-zinc-300">{currentPlan}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Type</span><span className="text-purple-400 font-medium">LIFETIME</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Expiry</span><span className="text-purple-400 font-medium">Never</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Duration</span><span className="text-purple-400 font-medium">Permanent</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-xs text-red-300">
                This action is <strong>irreversible</strong>. Once converted, the subscription cannot be reverted to a term-based model.
              </p>
            </div>
          </div>

          {/* Step 4: Reason */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">4</span>
              <h4 className="text-sm font-semibold text-zinc-100">Provide Reason</h4>
            </div>

            <div className="mb-4">
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

            <div className="mb-4">
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
                Notify user about lifetime conversion
              </span>
            </div>
          </div>

          {/* Step 5: Recent History */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">5</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <History size={14} />
                Recent Activity
              </h4>
            </div>
            {historyLoading ? (
              <div className="py-3 text-center text-xs text-zinc-500">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="py-3 text-center text-xs text-zinc-500">No prior activity found.</div>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-medium text-zinc-300">{h.action}</span>
                      <span className="text-zinc-500">{h.plan}</span>
                      {h.subscriptionType && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-500">{h.subscriptionType}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-zinc-500">
                      {h.grantedBy && <span>{h.grantedBy}</span>}
                      <span>{fmt(new Date(h.createdAt))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <span className="text-yellow-400">CONVERTED_TO_LIFETIME</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">License</span>
                <span className="text-zinc-300">{licenseKey || licenseId}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Organization</span>
                <span className="text-zinc-300">{organization}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Plan</span>
                <span className="text-zinc-300">{currentPlan}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Previous Type</span>
                <span className="text-zinc-300">{currentSubscriptionType}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">New Type</span>
                <span className="text-purple-400">LIFETIME</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Reason</span>
                <span className="text-zinc-300">{reason || <span className="text-zinc-600">(not set)</span>}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Notify</span>
                <span className={notifyUser ? "text-green-400" : "text-zinc-500"}>{notifyUser ? "Yes" : "No"}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Effect</span>
                <span className="text-purple-400">Never expires</span>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-400">
              I acknowledge this is a <strong className="text-red-400">permanent, irreversible</strong> conversion to a lifetime subscription.
            </span>
          </label>
        </div>
      </Modal>
    </>
  );
}
