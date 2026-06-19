"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PLANS, DEFAULT_MAX_DEVICES, PLAN_PRICES } from "@/lib/constants";
import { Building2, Calendar, Monitor, FileText, DollarSign } from "lucide-react";

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

interface Props {
  open?: boolean;
  onClose?: () => void;
}

export default function CreateOrganizationModal({
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
  const [orgName, setOrgName] = useState("");
  const [plan, setPlan] = useState("ENTERPRISE");
  const [maxDevices, setMaxDevices] = useState(DEFAULT_MAX_DEVICES);
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [useCustomPricing, setUseCustomPricing] = useState(false);
  const [customPrice, setCustomPrice] = useState(0);

  const valid = orgName.trim();
  const defaultPrice = PLAN_PRICES[plan] || 0;
  const finalPrice = useCustomPricing ? customPrice : defaultPrice;

  const computedExpiry = expiresAt ? new Date(expiresAt) : null;
  const durationMonths = computedExpiry
    ? Math.max(1, Math.round((computedExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
    : 12;

  const annualCost = useMemo(() => {
    const monthlyDeviceCost = maxDevices * 2;
    const monthlyPlanCost = finalPrice;
    return (monthlyDeviceCost + monthlyPlanCost) * durationMonths;
  }, [finalPrice, maxDevices, durationMonths]);

  async function handleCreate() {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        organization: orgName.trim(),
        plan,
        maxDevices,
        notes: notes || "",
      };
      if (expiresAt) body.expiresAt = expiresAt;

      const res = await fetch(API_ROUTES.LICENSES.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create organization");
        return;
      }
      setOpen(false);
      setOrgName("");
      setPlan("ENTERPRISE");
      setNotes("");
      router.refresh();
    } catch {
      setError("Failed to create organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {externalOpen === undefined && (
        <ActionButton onClick={() => setOpen(true)} variant="primary">
          <Building2 size={16} /> Create Organization
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Organization"
        description="Provision a new organization with an initial license."
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleCreate} disabled={loading || !valid}>
              {loading ? "Creating..." : "Create Organization"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Organization Info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
              <h4 className="text-sm font-semibold text-zinc-100">Organization Details</h4>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Organization Name</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Step 2: License Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">License Configuration</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  {PLANS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Max Devices</label>
                <div className="relative">
                  <Monitor size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="number" min="1" max="99999"
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Expiry Date (optional)</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
              {computedExpiry && (
                <p className="mt-1.5 text-xs text-zinc-500">License will expire on {fmt(computedExpiry)}</p>
              )}
            </div>
          </div>

          {/* Step 3: Cost & Pricing */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/[0.03] p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">3</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-green-300">
                <DollarSign size={14} />
                Cost &amp; Pricing
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                <span className="text-[10px] text-zinc-500">Plan Price</span>
                <p className="text-sm font-semibold text-zinc-100">{defaultPrice === 0 ? "Free" : `$${defaultPrice}/mo`}</p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                <span className="text-[10px] text-zinc-500">Devices ({maxDevices})</span>
                <p className="text-sm font-semibold text-zinc-100">${(maxDevices * 2).toLocaleString()}/mo</p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                <span className="text-[10px] text-zinc-500">Billing Period</span>
                <p className="text-sm font-semibold text-blue-400">{durationMonths}mo</p>
              </div>
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5">
                <span className="text-[10px] text-green-400">Total Cost</span>
                <p className="text-lg font-bold text-green-400">${annualCost.toLocaleString()}</p>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-300">Custom Price Override</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={useCustomPricing}
                    onChange={(e) => setUseCustomPricing(e.target.checked)} className="peer sr-only" />
                  <div className="h-5 w-9 rounded-full bg-zinc-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-zinc-400 after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
                </label>
              </div>
              {useCustomPricing && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2">
                      <span className="text-[10px] text-zinc-500">Default Price</span>
                      <p className="text-sm font-medium text-zinc-300">${defaultPrice}/mo</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-zinc-500">Custom Price ($/mo)</label>
                      <input type="number" min="0" value={customPrice}
                        onChange={(e) => setCustomPrice(Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">Final Price:</span>
                    <span className="font-semibold text-green-400">${finalPrice}/mo</span>
                    <span className="text-zinc-600">(${annualCost.toLocaleString()}/yr)</span>
                    {useCustomPricing && defaultPrice !== customPrice && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
                        {customPrice > defaultPrice ? "+" : ""}{((customPrice - defaultPrice) / (defaultPrice || 1) * 100).toFixed(0)}% vs default
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">4</span>
              <h4 className="text-sm font-semibold text-zinc-100">Notes (optional)</h4>
            </div>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-3 text-zinc-500" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this organization..."
                rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
              />
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
                <span className="text-yellow-400">LICENSE_CREATED</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Organization</span>
                <span className="text-zinc-300">{orgName || "\u2014"}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Plan</span>
                <span className="text-zinc-300">{plan}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Max Devices</span>
                <span className="text-zinc-300">{maxDevices}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Expiry</span>
                <span className="text-zinc-300">{computedExpiry ? fmt(computedExpiry) : "Default"}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Plan Cost</span>
                <span className="text-green-400">{finalPrice === 0 ? "Free" : `$${finalPrice}/mo`}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Devices</span>
                <span className="text-green-400">{maxDevices} &times; $2 = ${(maxDevices * 2).toLocaleString()}/mo</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Total</span>
                <span className="text-green-400">${annualCost.toLocaleString()} ({durationMonths}mo)</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
