"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PLAN_TIERS, PLAN_PRICES, ADMIN_SUBSCRIPTION_TYPES } from "@/lib/constants";
import { getPlanFeatureList } from "@/lib/premium";
import { daysUntil, formatPrice } from "@/lib/shared";
import { ArrowUp, ArrowDown, Check, Minus, ArrowRight, RefreshCw, Calendar } from "lucide-react";

interface Props {
  licenseId: string;
  currentPlan: string;
  currentSubscriptionType: string;
  currentExpiry: Date;
  organization: string;
  open?: boolean;
  onClose?: () => void;
}

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

export default function ChangePremiumPlanModal({
  licenseId, currentPlan, currentSubscriptionType, currentExpiry, organization,
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
  const [newPlan, setNewPlan] = useState("");
  const [newSubscriptionType, setNewSubscriptionType] = useState(currentSubscriptionType);
  const [remainingTimeOption, setRemainingTimeOption] = useState("keep");
  const [customDuration, setCustomDuration] = useState(1);
  const [customDurationUnit, setCustomDurationUnit] = useState<"days" | "weeks" | "months" | "years">("months");
  const [customStartDate, setCustomStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const isCustomSubscription = newSubscriptionType === "CUSTOM";

  const customDurationDays = useMemo(() => {
    switch (customDurationUnit) {
      case "days": return customDuration;
      case "weeks": return customDuration * 7;
      case "months": return customDuration * 30;
      case "years": return customDuration * 365;
      default: return customDuration;
    }
  }, [customDuration, customDurationUnit]);

  const customEndDate = useMemo(() => {
    if (!isCustomSubscription) return null;
    const start = new Date(customStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + customDurationDays);
    return end;
  }, [customStartDate, customDurationDays, isCustomSubscription]);

  const remainingDays = daysUntil(new Date(currentExpiry));
  const planTiers: readonly string[] = PLAN_TIERS;
  const currentIndex = planTiers.indexOf(currentPlan);
  const targetIndex = planTiers.indexOf(newPlan);

  const direction = useMemo(() => {
    if (!newPlan) return null;
    if (targetIndex === currentIndex) return null;
    return targetIndex > currentIndex ? "upgrade" : "downgrade";
  }, [newPlan, targetIndex, currentIndex]);

  const typeChanged = newSubscriptionType !== currentSubscriptionType;

  const currentPrice = PLAN_PRICES[currentPlan] || 0;
  const targetPrice = PLAN_PRICES[newPlan] || 0;
  const priceDiff = targetPrice - currentPrice;

  const customBilling = useMemo(() => {
    if (!isCustomSubscription || customDurationDays <= 0) return null;
    const total = (targetPrice / 30) * customDurationDays;
    return { total, perMonth: targetPrice, label: `${formatPrice(total, "$")} for ${customDuration} ${customDurationUnit}`, rate: `${formatPrice(targetPrice, "$")}/mo` };
  }, [targetPrice, isCustomSubscription, customDuration, customDurationUnit, customDurationDays]);

  const currentFeatures = useMemo(() => getPlanFeatureList(currentPlan), [currentPlan]);
  const targetFeatures = useMemo(() => getPlanFeatureList(newPlan), [newPlan]);
  const gainedFeatures = useMemo(
    () => direction === "upgrade" ? targetFeatures.filter((f) => !currentFeatures.includes(f)) : [],
    [direction, currentFeatures, targetFeatures]
  );
  const lostFeatures = useMemo(
    () => direction === "downgrade" ? currentFeatures.filter((f) => !targetFeatures.includes(f)) : [],
    [direction, currentFeatures, targetFeatures]
  );

  const planChanged = newPlan && newPlan !== currentPlan;
  const valid = planChanged || typeChanged;

  async function handleChange() {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      const endpoint = direction === "downgrade" ? "/api/premium/downgrade" : API_ROUTES.PREMIUM.CHANGE_PLAN;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseId,
          newPlan: planChanged ? newPlan : currentPlan,
          newSubscriptionType: typeChanged ? newSubscriptionType : undefined,
          remainingTimeOption,
          customDuration: isCustomSubscription ? customDuration : undefined,
          customDurationUnit: isCustomSubscription ? customDurationUnit : undefined,
          customDurationDays: isCustomSubscription ? customDurationDays : undefined,
          customStartDate: isCustomSubscription ? customStartDate : undefined,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change premium plan");
        return;
      }
      setOpen(false);
      setNewPlan("");
      setNotes("");
      router.refresh();
    } catch {
      setError("Failed to change premium plan");
    } finally {
      setLoading(false);
    }
  }

  const hasChanges = planChanged || typeChanged;

  return (
    <>
      {externalOpen === undefined && (
        <ActionButton onClick={() => setOpen(true)} variant="secondary" size="sm">
          Change Plan
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Change Premium Plan"
        description={`Modify the premium tier for ${organization}.`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleChange} disabled={loading || !valid}>
              {loading ? "Applying..." : "Apply Change"}
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
              <div className={remainingDays < 0 ? "text-red-400" : "text-zinc-100"}>{fmt(new Date(currentExpiry))}</div>
              <div className="text-zinc-500">Remaining</div>
              <div className={remainingDays < 0 ? "text-red-400" : "text-zinc-100"}>{remainingDays < 0 ? "Expired" : `${remainingDays} days`}</div>
              <div className="text-zinc-500">Monthly Price</div>
              <div className="text-zinc-100">{formatPrice(currentPrice, "$")}/mo</div>
            </div>
          </div>

          {/* Step 2: Target Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Target Configuration</h4>
            </div>

            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">New Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  <option value="">Select a target plan...</option>
                  {PLAN_TIERS.map((p) => {
                    const pIndex = planTiers.indexOf(p);
                    const isCurrent = p === currentPlan;
                    const isUpgrade = pIndex > currentIndex;
                    const isDowngrade = pIndex < currentIndex;
                    return (
                      <option key={p} value={p} disabled={isCurrent}>
                        {p} &mdash; {formatPrice(PLAN_PRICES[p], "$")}/mo
                        {isCurrent ? " (current)" : ""}
                        {isUpgrade ? " ↑" : ""}
                        {isDowngrade ? " ↓" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Subscription Type</label>
                <select
                  value={newSubscriptionType}
                  onChange={(e) => setNewSubscriptionType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  {ADMIN_SUBSCRIPTION_TYPES.map((t) => (
                    <option key={t} value={t} disabled={t === currentSubscriptionType}>
                      {t}{t === currentSubscriptionType ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasChanges && (
              <div className="space-y-3">
                <div className={`rounded-lg border p-4 ${
                  direction === "upgrade"
                    ? "border-green-500/20 bg-green-500/5"
                    : direction === "downgrade"
                    ? "border-red-500/20 bg-red-500/5"
                    : "border-blue-500/20 bg-blue-500/5"
                }`}>
                  <div className="flex items-center gap-3">
                    {planChanged && (
                      <span className={`flex items-center gap-1.5 text-sm font-semibold ${
                        direction === "upgrade" ? "text-green-400" : direction === "downgrade" ? "text-red-400" : "text-blue-400"
                      }`}>
                        {direction === "upgrade" ? <ArrowUp size={16} /> : direction === "downgrade" ? <ArrowDown size={16} /> : <RefreshCw size={16} />}
                        {direction === "upgrade" ? "Upgrade" : direction === "downgrade" ? "Downgrade" : "Same Tier"}
                      </span>
                    )}
                    {planChanged && (
                      <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                        <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs">{currentPlan}</span>
                        <ArrowRight size={12} className="text-zinc-500" />
                        <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs">{newPlan}</span>
                      </span>
                    )}
                    {typeChanged && (
                      <span className="text-sm text-zinc-400">
                        <span className="text-zinc-500">Type:</span> {currentSubscriptionType} <ArrowRight size={12} className="inline text-zinc-500" /> {newSubscriptionType}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-zinc-500">Current Price</span>
                      <p className="font-medium text-zinc-300">{formatPrice(currentPrice, "$")}/mo</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500">New Price</span>
                      <p className={`font-medium ${direction === "upgrade" ? "text-green-400" : direction === "downgrade" ? "text-red-400" : "text-zinc-300"}`}>
                        {customBilling ? customBilling.label : `${formatPrice(targetPrice, "$")}/mo`}
                      </p>
                    </div>
                  </div>

                  {priceDiff !== 0 && (
                    <div className={`mt-2 rounded-md px-3 py-1.5 text-xs ${
                      direction === "upgrade"
                        ? "bg-green-500/10 text-green-300"
                        : "bg-red-500/10 text-red-300"
                    }`}>
                      <span className="font-medium">Impact: </span>
                      {direction === "upgrade" ? "+" : ""}{formatPrice(priceDiff, "$")}/mo
                    </div>
                  )}

                  {(gainedFeatures.length > 0 || lostFeatures.length > 0) && (
                    <div className="mt-3 space-y-1.5">
                      <div className="text-xs font-medium text-zinc-400">Feature Changes</div>
                      {gainedFeatures.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-green-300">
                          <Check size={12} className="shrink-0" />
                          {f}
                        </div>
                      ))}
                      {lostFeatures.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-red-300">
                          <Minus size={12} className="shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Remaining Time */}
          {(direction === "downgrade" || typeChanged) && remainingDays > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
                <h4 className="text-sm font-semibold text-zinc-100">Remaining Time Handling</h4>
              </div>

              <p className="mb-3 text-xs text-zinc-500">
                {remainingDays} days remain at {currentPlan} pricing. Choose how to handle the remaining term:
              </p>

              <div className="space-y-2">
                {[
                  { value: "keep", label: "Keep existing expiry", desc: `Expiry stays at ${fmt(new Date(currentExpiry))}. ${remainingDays} days remain on the new plan.` },
                  { value: "prorate", label: "Prorate remaining time", desc: "Remaining time is adjusted proportionally to the new plan's value." },
                  { value: "reset", label: "Reset to full term", desc: `A new term starts from today (recommended for downgrades).` },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      remainingTimeOption === opt.value
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="remainingTime"
                      value={opt.value}
                      checked={remainingTimeOption === opt.value}
                      onChange={(e) => setRemainingTimeOption(e.target.value)}
                      className="mt-0.5 h-4 w-4 border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{opt.label}</div>
                      <div className="mt-0.5 text-xs text-zinc-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom Duration (only when CUSTOM type) */}
          {isCustomSubscription && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">
                  {direction === "downgrade" || typeChanged ? "4" : "3"}
                </span>
                <h4 className="text-sm font-semibold text-zinc-100">Custom Duration</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration</label>
                  <input
                    type="number" min="1" max="36500"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Unit</label>
                  <div className="flex gap-2">
                    {(["days", "weeks", "months", "years"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setCustomDurationUnit(unit)}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                          customDurationUnit === unit
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Start Date</label>
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Calculated End Date</label>
                  <div className="flex h-[42px] items-center rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-300">
                    {customEndDate ? (
                      <span className="text-blue-400">{fmt(customEndDate)}</span>
                    ) : <span className="text-zinc-600">Select start date</span>}
                  </div>
                </div>
              </div>

              {customEndDate && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                  <div className="text-xs text-blue-300">
                    <span className="font-medium">Duration Preview:</span>{" "}
                    {customDuration} {customDurationUnit} ({customDurationDays.toLocaleString()} days) &mdash;{" "}
                    {fmt(new Date(customStartDate))} &rarr; {fmt(customEndDate)}
                  </div>
                  {customBilling && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-zinc-500">Rate:</span>
                      <span className="text-zinc-300">{customBilling.rate}</span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-500">Total Billing Value:</span>
                      <span className="text-green-400 font-medium">{customBilling.label}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">
                {isCustomSubscription ? (direction === "downgrade" || typeChanged ? "5" : "4") : (direction === "downgrade" || typeChanged ? "4" : "3")}
              </span>
              <h4 className="text-sm font-semibold text-zinc-100">Notes (optional)</h4>
            </div>
            <textarea
              placeholder="Reason for plan change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
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
                <span className="text-yellow-400">
                  {direction === "downgrade" ? "DOWNGRADED" : typeChanged && !planChanged ? "SUBSCRIPTION_TYPE_CHANGED" : "PLAN_CHANGED"}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">License</span>
                <span className="text-zinc-300">{licenseId}</span>
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
                <span className="text-zinc-300">
                  {newPlan || currentPlan} / {newSubscriptionType || currentSubscriptionType}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Direction</span>
                <span className={direction === "upgrade" ? "text-green-400" : direction === "downgrade" ? "text-red-400" : "text-blue-400"}>
                  {direction ? (direction === "upgrade" ? "Upgrade" : "Downgrade") : typeChanged ? "Type Change" : "\u2014"}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Impact</span>
                <span className={priceDiff > 0 ? "text-green-400" : priceDiff < 0 ? "text-red-400" : "text-zinc-300"}>
                  {priceDiff === 0 ? "$0" : `${priceDiff > 0 ? "+" : ""}${formatPrice(priceDiff, "$")}/mo`}
                </span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Remaining</span>
                <span className="text-zinc-300">
                  {isCustomSubscription
                    ? `${customDuration} ${customDurationUnit} (${customDurationDays} days)`
                    : remainingDays > 0 && (direction === "downgrade" || typeChanged)
                    ? `${remainingDays} days (${remainingTimeOption})`
                    : "Unaffected"}
                </span>
              </div>
              {customBilling && (
                <div className="flex">
                  <span className="w-28 text-zinc-500">Billing</span>
                  <span className="text-green-400">{customBilling.label}</span>
                </div>
              )}
              {isCustomSubscription && customEndDate && (
                <div className="flex">
                  <span className="w-28 text-zinc-500">New Expiry</span>
                  <span className="text-blue-400">{fmt(customEndDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
