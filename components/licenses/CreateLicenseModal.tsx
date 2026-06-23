"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES, PLANS, LICENSE_STATUSES, DEFAULT_PLAN, DEFAULT_MAX_DEVICES, PLAN_PRICES } from "@/lib/constants";
import { formatPrice } from "@/lib/shared";
import { Building2, Cpu, Calendar, FileText, CheckCircle, Shield, Eye, Timer, DollarSign } from "lucide-react";

const PLAN_DESCRIPTIONS: Record<string, string> = {
  FREE: "Basic access with limited features",
  BASIC: "Essential features for small teams",
  PLUS: "Advanced features for growing teams",
  PRO: "Professional tools for serious teams",
  BUSINESS: "Enterprise-grade solutions",
  ENTERPRISE: "Full platform access with premium support",
};

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400",
  SUSPENDED: "bg-red-500/10 text-red-400",
  PENDING: "bg-yellow-500/10 text-yellow-400",
  EXPIRED: "bg-zinc-500/10 text-zinc-400",
  REVOKED: "bg-red-600/10 text-red-500",
};

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

export default function CreateLicenseModal() {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!hasPermission("Create Licenses") && !open) return null;

  const [organization, setOrganization] = useState("");
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [maxDevices, setMaxDevices] = useState(DEFAULT_MAX_DEVICES);
  const [status, setStatus] = useState("ACTIVE");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  const [useDuration, setUseDuration] = useState(false);
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks" | "months" | "years">("years");
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const computedEndDate = useMemo(() => {
    if (!useDuration) return null;
    const start = new Date();
    const end = new Date(start);
    const multiplier = durationUnit === "days" ? 1 : durationUnit === "weeks" ? 7 : durationUnit === "months" ? 30 : 365;
    end.setDate(end.getDate() + durationValue * multiplier);
    return end;
  }, [durationValue, durationUnit, useDuration]);

  const effectiveExpiry = useDuration && computedEndDate
    ? computedEndDate.toISOString().split("T")[0]
    : expiresAt || "no-expiry";

  const licenseCost = useMemo(() => {
    const price = PLAN_PRICES[plan] || 0;
    if (price === 0) return { perMonth: 0, total: 0, label: "Free", billingValue: 0 };
    const perMonth = price;
    if (useDuration && computedEndDate) {
      const months = Math.max(1, Math.round((computedEndDate.getTime() - now) / (1000 * 60 * 60 * 24 * 30)));
      return { perMonth, total: perMonth * months, label: `${formatPrice(perMonth, "$")}/mo for ${months}mo`, billingValue: perMonth * months };
    }
    if (expiresAt) {
      const months = Math.max(1, Math.round((new Date(expiresAt).getTime() - now) / (1000 * 60 * 60 * 24 * 30)));
      return { perMonth, total: perMonth * months, label: `${formatPrice(perMonth, "$")}/mo for ${months}mo`, billingValue: perMonth * months };
    }
    return { perMonth, total: perMonth * 12, label: `${formatPrice(perMonth, "$")}/mo (annual)`, billingValue: perMonth * 12 };
  }, [plan, useDuration, computedEndDate, expiresAt, now]);

  async function createLicense() {
    setError("");
    if (!organization.trim()) {
      setError("Organization name is required");
      return;
    }
    if (maxDevices < 1) {
      setError("Max devices must be at least 1");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization,
          plan,
          maxDevices,
          status,
          expiresAt: effectiveExpiry === "no-expiry" ? undefined : effectiveExpiry,
          notes,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to create license");
        return;
      }
      setOpen(false);
      setOrganization("");
      setPlan(DEFAULT_PLAN);
      setMaxDevices(DEFAULT_MAX_DEVICES);
      setStatus("ACTIVE");
      setExpiresAt("");
      setNotes("");
      setUseDuration(false);
      setDurationValue(1);
      setDurationUnit("years");
      router.refresh();
    } catch {
      setError("Failed to create license");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="primary" size="lg">
        Create License
      </ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create License"
        description="Configure the license before generating the key."
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={createLicense} disabled={loading}>
              {loading ? "Creating..." : "Create License"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Organization Details */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Organization Details</h4>
            </div>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition-colors focus:border-blue-500"
              />
            </div>
          </div>

          {/* Step 2: Plan Selection */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Plan Selection</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {PLANS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  className={`rounded-xl border p-3 text-left text-sm transition-all ${
                    plan === p
                      ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/20"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      plan === p ? "border-blue-500 bg-blue-500" : "border-zinc-600"
                    }`}>
                      {plan === p && <CheckCircle size={10} className="text-white" />}
                    </span>
                    <span className="font-medium text-zinc-200">{p}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-tight text-zinc-500">{PLAN_DESCRIPTIONS[p]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Configuration</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Cpu className="mr-1 inline" size={12} />
                  Max Devices
                </label>
                <input
                  type="number" min="1" value={maxDevices}
                  onChange={(e) => setMaxDevices(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Shield className="mr-1 inline" size={12} />
                  Status
                </label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  {LICENSE_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <Timer className="mr-1 inline" size={12} />
                Duration
              </label>
              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDuration}
                    onChange={(e) => setUseDuration(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-xs text-zinc-400">Set duration instead of fixed date</span>
                </label>
              </div>

              {useDuration ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration</label>
                    <input
                      type="number" min="1" max="36500"
                      value={durationValue}
                      onChange={(e) => setDurationValue(Number(e.target.value))}
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
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    <Calendar className="mr-1 inline" size={12} />
                    Expiry Date {!useDuration && <span className="text-zinc-600">(leave empty for no expiry)</span>}
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {useDuration && computedEndDate && (
              <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center gap-2 text-xs text-blue-300">
                  <Calendar size={12} />
                  <span className="font-medium">Expiration Preview:</span>{" "}
                  {fmt(computedEndDate)}
                  <span className="text-zinc-500">&middot;</span>
                  <span className="text-zinc-400">
                    {durationValue} {durationUnit} from today
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Cost Summary */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">4</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-green-300">
                <DollarSign size={14} />
                Cost &amp; Value Summary
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                <span className="text-[10px] text-zinc-500">License Cost</span>
                <p className="text-sm font-semibold text-zinc-100">
                  {licenseCost.perMonth === 0 ? "Free" : `${formatPrice(licenseCost.perMonth, "$")}/mo`}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                <span className="text-[10px] text-zinc-500">Billing Value</span>
                <p className="text-sm font-semibold text-green-400">{formatPrice(licenseCost.billingValue, "$")}</p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                <span className="text-[10px] text-zinc-500">Selected Plan</span>
                <p className="text-sm font-semibold text-blue-400">{plan}</p>
              </div>
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5">
                <span className="text-[10px] text-green-400">Total Cost</span>
                <p className="text-lg font-bold text-green-400">
                  {licenseCost.total === 0 ? "Free" : formatPrice(licenseCost.total, "$")}
                </p>
              </div>
            </div>
          </div>

          {/* Step 5: Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">5</span>
              <h4 className="text-sm font-semibold text-zinc-100">Notes</h4>
            </div>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-3 text-zinc-500" />
              <textarea
                placeholder="Additional information or context for this license..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition-colors focus:border-blue-500"
              />
            </div>
          </div>

          {/* Step 6: Summary & Audit */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">6</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <Eye size={14} />
                Summary &amp; Audit
              </h4>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Organization</span>
                <p className="font-medium text-zinc-200">{organization || <span className="text-zinc-600">(not set)</span>}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Plan</span>
                <p className="font-medium text-blue-400">{plan}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Max Devices</span>
                <p className="font-medium text-zinc-200">{maxDevices}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Status</span>
                <p className={`font-medium ${STATUS_BADGES[status]?.split(" ")[1] || "text-zinc-200"}`}>{status}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Expiry</span>
                <p className="font-medium text-zinc-200">
                  {useDuration && computedEndDate
                    ? fmt(computedEndDate)
                    : expiresAt
                    ? fmt(new Date(expiresAt))
                    : <span className="text-zinc-600">No expiry</span>}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Duration</span>
                <p className="font-medium text-zinc-200">
                  {useDuration ? `${durationValue} ${durationUnit}` : expiresAt ? "Fixed date" : "Unlimited"}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Cost</span>
                <p className="font-medium text-green-400">{licenseCost.total === 0 ? "Free" : formatPrice(licenseCost.total, "$")}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Billing Value</span>
                <p className="font-medium text-green-400">{formatPrice(licenseCost.billingValue, "$")}</p>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex">
                  <span className="w-28 text-zinc-500">Action</span>
                  <span className="text-yellow-400">LICENSE_CREATED</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Organization</span>
                  <span className="text-zinc-300">{organization || <span className="text-zinc-600">(not set)</span>}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Plan</span>
                  <span className="text-zinc-300">{plan}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Devices</span>
                  <span className="text-zinc-300">{maxDevices}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Status</span>
                  <span className={`${STATUS_BADGES[status]?.replace("bg-", "text-").split(" ")[0] || "text-zinc-300"}`}>{status}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Expiry</span>
                  <span className="text-zinc-300">
                    {useDuration && computedEndDate
                      ? computedEndDate.toISOString().split("T")[0]
                      : expiresAt || "None"}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Cost</span>
                  <span className="text-green-400">{licenseCost.total === 0 ? "Free" : formatPrice(licenseCost.total, "$")}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Billing</span>
                  <span className="text-green-400">{formatPrice(licenseCost.billingValue, "$")}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Notes</span>
                  <span className="text-zinc-300">{notes || <span className="text-zinc-600">(none)</span>}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
