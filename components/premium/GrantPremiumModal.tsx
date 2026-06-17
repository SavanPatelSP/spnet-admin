"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PLAN_TIERS, SUBSCRIPTION_TYPES } from "@/lib/constants";
import { Search, Building2, Key, User, Crown, CalendarDays, CheckCircle, X } from "lucide-react";

interface LicenseOption {
  id: string;
  key: string;
  organization: string;
}

interface GrantPremiumModalProps {
  licenseId?: string;
  licenseOrg?: string;
  availableLicenses?: LicenseOption[];
  requests?: { licenseId: string; submittedBy: string; organization: string }[];
}

const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  BASIC: 4,
  PLUS: 9,
  PRO: 29,
  BUSINESS: 99,
  ENTERPRISE: 299,
};

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

export default function GrantPremiumModal({
  licenseId: propLicenseId,
  licenseOrg,
  availableLicenses,
  requests,
}: GrantPremiumModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orgSearch, setOrgSearch] = useState("");
  const [licenseSearch, setLicenseSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [licenseId, setLicenseId] = useState(propLicenseId || "");
  const [plan, setPlan] = useState<string>("ENTERPRISE");
  const [subscriptionType, setSubscriptionType] = useState<string>("YEARLY");
  const [durationDays, setDurationDays] = useState(365);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [notifyUser, setNotifyUser] = useState(true);
  const [notes, setNotes] = useState("");

  const isLifetime = subscriptionType === "LIFETIME";

  const computedEndDate = useMemo(() => {
    if (isLifetime) return null;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);
    return end;
  }, [startDate, durationDays, isLifetime]);

  const planPrice = PLAN_PRICES[plan] || 0;

  const filteredLicenses = useMemo(() => {
    if (!availableLicenses) return [];
    const oq = orgSearch.toLowerCase();
    const lq = licenseSearch.toLowerCase();
    const uq = userSearch.toLowerCase();
    return availableLicenses.filter((l) => {
      const orgMatch = !oq || l.organization.toLowerCase().includes(oq);
      const keyMatch = !lq || l.key.toLowerCase().includes(lq);
      const request = requests?.find((r) => r.licenseId === l.id);
      const submitterName = request?.submittedBy?.toLowerCase() || "";
      const userMatch = !uq || l.organization.toLowerCase().includes(uq) || submitterName.includes(uq);
      return orgMatch && keyMatch && userMatch;
    });
  }, [availableLicenses, orgSearch, licenseSearch, userSearch, requests]);

  const selectedLicense = availableLicenses?.find((l) => l.id === licenseId);
  const selectedRequest = requests?.find((r) => r.licenseId === licenseId);

  const hasAnySearch = orgSearch || licenseSearch || userSearch;
  const showResults = open && !propLicenseId && availableLicenses && hasAnySearch;

  function resetSelection() {
    setLicenseId("");
    setOrgSearch("");
    setLicenseSearch("");
    setUserSearch("");
  }

  function clearSearchs() {
    setOrgSearch("");
    setLicenseSearch("");
    setUserSearch("");
  }

  async function handleGrant() {
    setError("");
    const targetId = propLicenseId || licenseId;
    if (!targetId) {
      setError("Please search and select a license");
      return;
    }
    if (!isLifetime && durationDays < 1) {
      setError("Duration must be at least 1 day");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.PREMIUM.GRANT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseId: targetId,
          plan,
          subscriptionType,
          durationDays: isLifetime ? undefined : durationDays,
          startDate,
          notes: [notes, notifyUser ? "Notify user requested" : ""].filter(Boolean).join(" | ") || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to grant premium");
        return;
      }
      setOpen(false);
      resetSelection();
      setPlan("ENTERPRISE");
      setSubscriptionType("YEARLY");
      setDurationDays(365);
      setStartDate(new Date().toISOString().split("T")[0]);
      setNotifyUser(true);
      setNotes("");
      router.refresh();
    } catch {
      setError("Failed to grant premium");
    } finally {
      setLoading(false);
    }
  }

  const needsSelection = !propLicenseId && !licenseId;

  return (
    <>
      {propLicenseId ? (
        <ActionButton onClick={() => setOpen(true)} variant="primary" size="sm">
          Grant Premium
        </ActionButton>
      ) : (
        <ActionButton onClick={() => setOpen(true)} variant="primary" size="lg">
          Grant Premium
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); resetSelection(); }}
        title="Grant Premium"
        description={licenseOrg ? `Grant premium to ${licenseOrg}` : "Provision a premium subscription."}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => { setOpen(false); resetSelection(); }}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleGrant} disabled={loading || needsSelection}>
              {loading ? "Granting..." : "Grant Premium"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Select License */}
          {!propLicenseId && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
                <h4 className="text-sm font-semibold text-zinc-100">Select License</h4>
              </div>

              <div className="space-y-2.5">
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by organization..."
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative">
                  <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by license key..."
                    value={licenseSearch}
                    onChange={(e) => setLicenseSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                  />
                </div>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by user (submitter)..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {hasAnySearch && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-zinc-800">
                  {filteredLicenses.length === 0 ? (
                    <div className="flex items-center justify-center gap-2 p-6 text-sm text-zinc-500">
                      <Search size={14} />
                      No licenses match your search criteria
                    </div>
                  ) : (
                    filteredLicenses.map((l) => {
                      const request = requests?.find((r) => r.licenseId === l.id);
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => {
                            setLicenseId(l.id);
                            setOrgSearch(l.organization);
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-800 ${
                            licenseId === l.id ? "bg-blue-500/10 ring-1 ring-inset ring-blue-500/30" : ""
                          }`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            licenseId === l.id
                              ? "border-blue-500 bg-blue-500"
                              : "border-zinc-600"
                          }`}>
                            {licenseId === l.id && <CheckCircle size={12} className="text-white" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-200">{l.organization}</span>
                              <code className="text-xs text-zinc-500">{l.key}</code>
                            </div>
                            {request?.submittedBy && (
                              <div className="mt-0.5 text-xs text-zinc-500">
                                Requested by: {request.submittedBy}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {!hasAnySearch && (
                <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-zinc-800 p-6">
                  <Search size={16} className="mr-2 text-zinc-600" />
                  <span className="text-sm text-zinc-600">Use the search fields above to find a license</span>
                </div>
              )}
            </div>
          )}

          {/* Selected license summary (when chosen) */}
          {selectedLicense && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{selectedLicense.organization}</p>
                    <code className="text-xs text-zinc-500">{selectedLicense.key}</code>
                  </div>
                </div>
                {selectedRequest?.submittedBy && (
                  <span className="text-xs text-zinc-500">Requested: {selectedRequest.submittedBy}</span>
                )}
                <button type="button" onClick={clearSearchs} className="text-zinc-500 hover:text-zinc-300">
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configure Plan */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Configure Plan</h4>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Plan Tier</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  {PLAN_TIERS.map((p) => {
                    const price = PLAN_PRICES[p];
                    const isFree = price === 0;
                    return (
                      <option key={p} value={p}>
                        {p}{isFree ? "" : ` ($${price}/mo)`}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Subscription Type</label>
                <select
                  value={subscriptionType}
                  onChange={(e) => setSubscriptionType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  {SUBSCRIPTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {!isLifetime ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="36500"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">End Date</label>
                  <div className="flex h-[42px] items-center rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-300">
                    {computedEndDate ? fmt(computedEndDate) : <span className="text-zinc-600">Auto-computed</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300">
                Lifetime subscription selected &mdash; no duration or end date needed.
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-zinc-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-zinc-400 after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
              </label>
              <span className="text-xs text-zinc-400">Notify user about this grant</span>
            </div>
          </div>

          {/* Step 3: Review & Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Review &amp; Notes</h4>
            </div>

            <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 text-xs">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">License</span>
                  <span className="text-zinc-200 font-mono">{selectedLicense?.key || propLicenseId || licenseId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Organization</span>
                  <span className="text-zinc-200">{selectedLicense?.organization || licenseOrg || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Plan</span>
                  <span className="text-zinc-200">{plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Type</span>
                  <span className="text-zinc-200">{subscriptionType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Duration</span>
                  <span className="text-zinc-200">{isLifetime ? "Lifetime" : `${durationDays} days`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Price</span>
                  <span className="text-zinc-200">{planPrice === 0 ? "Free" : `$${planPrice}/mo`}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-zinc-500">Date Range</span>
                  <span className="text-zinc-200">
                    {fmt(new Date(startDate))} &rarr; {computedEndDate ? fmt(computedEndDate) : "Never"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Notes (optional)</label>
              <textarea
                placeholder="Reason for granting premium..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Step 4: Audit Preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">4</span>
              <h4 className="text-sm font-semibold text-zinc-100">Audit Trail Preview</h4>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex">
                <span className="w-24 text-zinc-500">Action</span>
                <span className="text-yellow-400">PREMIUM_GRANTED</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">License</span>
                <span className="text-zinc-300">{propLicenseId || licenseId || <span className="text-zinc-600">(not selected)</span>}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Organization</span>
                <span className="text-zinc-300">{selectedLicense?.organization || licenseOrg || <span className="text-zinc-600">(not selected)</span>}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Plan</span>
                <span className="text-zinc-300">{plan}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Type</span>
                <span className="text-zinc-300">{subscriptionType}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Duration</span>
                <span className="text-zinc-300">{!computedEndDate ? "Lifetime" : `${durationDays} days`}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Billing</span>
                <span className="text-zinc-300">{planPrice === 0 ? "Free" : `$${planPrice.toLocaleString()}/mo`}</span>
              </div>
              <div className="flex">
                <span className="w-24 text-zinc-500">Notify</span>
                <span className={notifyUser ? "text-green-400" : "text-zinc-500"}>{notifyUser ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
