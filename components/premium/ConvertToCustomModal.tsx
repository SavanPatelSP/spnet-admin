"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PREMIUM_PLANS } from "@/lib/constants";
import { daysUntil } from "@/lib/shared";
import { Calendar, AlertTriangle, DollarSign } from "lucide-react";

const PLAN_PRICES: Record<string, number> = {
  PLUS: 9, PRO: 29, BUSINESS: 99, ENTERPRISE: 299,
};

const DURATION_UNITS = ["days", "weeks", "months", "years"] as const;

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

export default function ConvertToCustomModal({
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
  const [targetPlan, setTargetPlan] = useState("");
  const [duration, setDuration] = useState(30);
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks" | "months" | "years">("days");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const remainingDays = daysUntil(new Date(currentExpiry));
  const isExpired = remainingDays < 0;

  const durationDays = useMemo(() => {
    switch (durationUnit) {
      case "days": return duration;
      case "weeks": return duration * 7;
      case "months": return duration * 30;
      case "years": return duration * 365;
      default: return duration;
    }
  }, [duration, durationUnit]);

  const endDate = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    return end;
  }, [startDate, durationDays]);

  const planPrice = PLAN_PRICES[targetPlan] || 0;

  const computedBilling = useMemo(() => {
    if (!targetPlan || planPrice === 0 || durationDays <= 0) return null;
    const total = (planPrice / 30) * durationDays;
    return {
      total,
      perMonth: planPrice,
      short: `$${total.toFixed(2)} for ${duration} ${durationUnit}`,
      rate: `$${planPrice}/mo`,
    };
  }, [targetPlan, planPrice, duration, durationUnit, durationDays]);

  const valid = targetPlan && duration > 0 && acknowledged;

  async function handleConvert() {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.PREMIUM.CONVERT_CUSTOM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseId,
          plan: targetPlan,
          durationDays,
          startDate,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to convert to custom subscription");
        return;
      }
      setOpen(false);
      setTargetPlan("");
      setNotes("");
      setAcknowledged(false);
      router.refresh();
    } catch {
      setError("Failed to convert to custom subscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {externalOpen === undefined && (
        <ActionButton onClick={() => setOpen(true)} variant="secondary" size="sm">
          Convert to Custom
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Convert to Custom Subscription"
        description={`Create a custom-term premium subscription for ${organization}.`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleConvert} disabled={loading || !valid}>
              {loading ? "Converting..." : "Convert to Custom"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Current Subscription */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Current Subscription</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
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

          {/* Step 2: Target Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Target Configuration</h4>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Target Plan</label>
              <select
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              >
                <option value="">Select a premium plan...</option>
                {PREMIUM_PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration</label>
                <input
                  type="number" min="1" max="36500"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Unit</label>
                <div className="flex gap-2">
                  {DURATION_UNITS.map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setDurationUnit(unit)}
                      className={`flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                        durationUnit === unit
                          ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Start Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Calculated End Date</label>
                <div className="flex h-[42px] items-center rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-300">
                  <span className="text-blue-400">{fmt(endDate)}</span>
                </div>
              </div>
            </div>

            {endDate && (
              <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="text-xs text-blue-300">
                  <span className="font-medium">Duration Preview:</span>{" "}
                  {duration} {durationUnit} ({durationDays.toLocaleString()} days) &mdash;{" "}
                  {fmt(new Date(startDate))} &rarr; {fmt(endDate)}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Impact Summary */}
          {targetPlan && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
                <h4 className="text-sm font-semibold text-zinc-100">Impact Summary</h4>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  <div className="text-zinc-500">Old Plan</div>
                  <div className="text-zinc-300">{currentPlan} ({currentSubscriptionType})</div>
                  <div className="text-zinc-500">New Plan</div>
                  <div className="text-cyan-400">{targetPlan} (CUSTOM)</div>
                  <div className="text-zinc-500">Old Expiry</div>
                  <div className="text-zinc-300">{fmt(new Date(currentExpiry))}</div>
                  <div className="text-zinc-500">New Expiry</div>
                  <div className="text-cyan-400">{fmt(endDate)}</div>
                  <div className="text-zinc-500">Duration</div>
                  <div className="text-zinc-300">{duration} {durationUnit} ({durationDays.toLocaleString()} days)</div>
                  {computedBilling && (
                    <>
                      <div className="text-zinc-500">Rate</div>
                      <div className="text-zinc-300">{computedBilling.rate}</div>
                      <div className="text-zinc-500">Billing Value</div>
                      <div className="text-cyan-400 font-medium">{computedBilling.short}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">{targetPlan ? "4" : "3"}</span>
              <h4 className="text-sm font-semibold text-zinc-100">Notes (optional)</h4>
            </div>
            <textarea
              placeholder="Reason for custom conversion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>

          {/* Step 5: Confirmation */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
              <div className="space-y-3">
                <p className="text-sm font-medium text-amber-300">Confirmation Required</p>
                <p className="text-xs text-amber-200/70">
                  This will replace the current {currentSubscriptionType} subscription with a custom {duration} {durationUnit} subscription.
                  The organization will be billed according to the custom terms configured above.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-xs text-zinc-400">
                    I understand that this action will convert the current subscription to a custom-term arrangement
                    starting {fmt(new Date(startDate))} and ending {fmt(endDate)}.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Audit Preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto p-3 sm:p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex">
                <span className="w-28 text-zinc-500">Action</span>
                <span className="text-yellow-400">CONVERTED_TO_CUSTOM</span>
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
                <span className="text-cyan-400">{targetPlan || "\u2014"} / CUSTOM</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Duration</span>
                <span className="text-zinc-300">{durationDays.toLocaleString()} days</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Start</span>
                <span className="text-zinc-300">{fmt(new Date(startDate))}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">End</span>
                <span className="text-blue-400">{fmt(endDate)}</span>
              </div>
              {computedBilling && (
                <div className="flex">
                  <span className="w-28 text-zinc-500">Billing</span>
                  <span className="text-zinc-300">{computedBilling.short}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
