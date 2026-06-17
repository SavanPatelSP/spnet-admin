"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { downloadCSV } from "@/lib/export";
import { PREMIUM_PLANS, PLANS, LICENSE_STATUSES, EXPIRING_SOON_DAYS } from "@/lib/constants";
import { daysUntil } from "@/lib/shared";
import { Crown } from "lucide-react";
import GrantPremiumModal from "@/components/premium/GrantPremiumModal";
import ExtendPremiumModal from "@/components/premium/ExtendPremiumModal";
import ChangePremiumPlanModal from "@/components/premium/ChangePremiumPlanModal";
import ConvertToLifetimeModal from "@/components/premium/ConvertToLifetimeModal";
import BulkGrantPremiumModal from "@/components/premium/BulkGrantPremiumModal";
import BulkExtendModal from "@/components/premium/BulkExtendModal";
import BulkConvertLifetimeModal from "@/components/premium/BulkConvertLifetimeModal";

interface LicenseRow {
  id: string;
  key: string;
  organization: string;
  plan: string;
  status: string;
  expiresAt: Date;
  maxDevices: number;
  deviceCount: number;
  subscriptionType?: string;
}

interface Props {
  licenses: LicenseRow[];
  availableForGrant: { id: string; key: string; organization: string }[];
}

export function PremiumTable({ licenses, availableForGrant }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [bulkGrantOpen, setBulkGrantOpen] = useState(false);
  const [bulkExtendOpen, setBulkExtendOpen] = useState(false);
  const [bulkConvertLifetimeOpen, setBulkConvertLifetimeOpen] = useState(false);

  const filtered = useMemo(() => {
    let f = licenses;
    if (statusFilter) f = f.filter((l) => l.status === statusFilter);
    if (planFilter) f = f.filter((l) => l.plan === planFilter);
    return f;
  }, [licenses, statusFilter, planFilter]);

  const premiumIds = useMemo(() => new Set(filtered.filter((l) => PREMIUM_PLANS.includes(l.plan as never)).map((l) => l.id)), [filtered]);

  function handleExportCSV() {
    const headers = ["Organization", "License Key", "Plan", "Status", "Expires At", "Days Left", "Devices", "Max Devices"];
    const rows = filtered.map((l) => [
      l.organization, l.key, l.plan, l.status,
      new Date(l.expiresAt).toISOString(),
      String(daysUntil(l.expiresAt)),
      String(l.deviceCount), String(l.maxDevices),
    ]);
    downloadCSV("premium-licenses", headers, rows);
  }

  async function bulkRevoke() {
    for (const id of selectedIds) {
      if (premiumIds.has(id)) {
        await fetch("/api/premium/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ licenseId: id }),
        });
      }
    }
    setSelectedIds(new Set());
    window.location.reload();
  }

  const premiumSelectedCount = [...selectedIds].filter((id) => premiumIds.has(id)).length;
  const nonPremiumSelectedCount = selectedIds.size - premiumSelectedCount;

  return (
    <>
    <DataTable
      selectable
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      exportable
      onExport={handleExportCSV}
      filters={
        <FilterBar
          filters={[
            {
              key: "status", label: "All Statuses", value: statusFilter, onChange: setStatusFilter,
              options: LICENSE_STATUSES.map((s) => ({ label: s, value: s })),
            },
            {
              key: "plan", label: "All Plans", value: planFilter, onChange: setPlanFilter,
              options: PLANS.map((p) => ({ label: p, value: p })),
            },
          ]}
          onClear={() => { setStatusFilter(""); setPlanFilter(""); }}
        />
      }
      bulkActions={
        selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            {nonPremiumSelectedCount > 0 && (
              <>
                <GrantPremiumModal
                  licenseId={selectedIds.size === 1 ? [...selectedIds].find((id) => !premiumIds.has(id)) : undefined}
                  licenseOrg={undefined}
                  availableLicenses={availableForGrant}
                />
                {nonPremiumSelectedCount > 1 && (
                  <button onClick={() => setBulkGrantOpen(true)} className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
                    Bulk Grant ({nonPremiumSelectedCount})
                  </button>
                )}
              </>
            )}
            {premiumSelectedCount > 0 && (
              <>
                <button onClick={() => setBulkExtendOpen(true)} className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
                  Extend ({premiumSelectedCount})
                </button>
                <button onClick={() => setBulkConvertLifetimeOpen(true)} className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500">
                  Convert to Lifetime ({premiumSelectedCount})
                </button>
                <button onClick={bulkRevoke} className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500">
                  Revoke ({premiumSelectedCount})
                </button>
              </>
            )}
          </div>
        )
      }
      columns={[
        { key: "organization", label: "Organization", sortable: true, searchable: true },
        { key: "key", label: "License Key", sortable: true, searchable: true },
        { key: "plan", label: "Plan", sortable: true },
        { key: "status", label: "Status", sortable: false },
        { key: "expiresAt", label: "Expiry", sortable: true },
        { key: "daysLeft", label: "Days Left", sortable: true },
        { key: "actions", label: "", sortable: false, className: "w-12" },
      ]}
      rows={filtered.map((l) => {
        const isPremium = PREMIUM_PLANS.includes(l.plan as never);
        const expiry = new Date(l.expiresAt);
        const days = daysUntil(expiry);
        const daysColor = days < 0 ? "text-red-400" : days <= EXPIRING_SOON_DAYS ? "text-yellow-400" : "text-zinc-300";
        return {
          id: l.id,
          values: {
            organization: l.organization,
            key: l.key,
            plan: l.plan,
            status: l.status,
            expiresAt: expiry.toISOString(),
            daysLeft: days,
            actions: "",
          },
          cells: [
            <span key="organization">{l.organization}</span>,
            <Link key="key" href={`/licenses/${l.id}`} className="font-mono text-sm text-blue-400 transition-colors hover:text-blue-300 hover:underline">
              {l.key}
            </Link>,
            <span key="plan" className="flex items-center gap-1.5">
              {isPremium && <Crown size={14} className="text-yellow-400" />}
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium">{l.plan}</span>
              {l.subscriptionType && (
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                  l.subscriptionType === "LIFETIME" ? "border-purple-500/20 bg-purple-500/10 text-purple-400" :
                  l.subscriptionType === "CUSTOM" ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400" :
                  l.subscriptionType === "YEARLY" ? "border-blue-500/20 bg-blue-500/10 text-blue-400" :
                  "border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
                }`}>{l.subscriptionType}</span>
              )}
            </span>,
            <span key="status"><StatusBadge status={l.status} /></span>,
            <span key="expiresAt" className={daysColor}>
              {(() => {
                const d2 = new Date(expiry);
                const dd2 = String(d2.getDate()).padStart(2, "0");
                const mm2 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d2.getMonth()];
                const yy2 = d2.getFullYear();
                return `${dd2} ${mm2} ${yy2}`;
              })()}
            </span>,
            <span key="daysLeft" className={daysColor}>
              {days < 0 ? "Expired" : `${days}d`}
            </span>,
            <div key="actions" className="flex items-center gap-1">
              {!isPremium ? (
                <GrantPremiumModal licenseId={l.id} licenseOrg={l.organization} availableLicenses={availableForGrant} />
              ) : (
                <PremiumRowActions
                  licenseId={l.id}
                  licenseKey={l.key}
                  organization={l.organization}
                  currentPlan={l.plan}
                  currentSubscriptionType={l.subscriptionType}
                  currentExpiry={l.expiresAt}
                />
              )}
            </div>,
          ],
        };
      })}
      searchPlaceholder="Search by organization or license key..."
      emptyMessage="No licenses found."
    />

      {bulkGrantOpen && (
        <BulkGrantPremiumModal
          licenseIds={[...selectedIds].filter((id) => !premiumIds.has(id))}
          onClose={() => { setBulkGrantOpen(false); setSelectedIds(new Set()); }}
        />
      )}
      {bulkExtendOpen && (
        <BulkExtendModal
          licenseIds={[...selectedIds].filter((id) => premiumIds.has(id))}
          onClose={() => { setBulkExtendOpen(false); setSelectedIds(new Set()); }}
        />
      )}
      {bulkConvertLifetimeOpen && (
        <BulkConvertLifetimeModal
          licenseIds={[...selectedIds].filter((id) => premiumIds.has(id))}
          onClose={() => { setBulkConvertLifetimeOpen(false); setSelectedIds(new Set()); }}
        />
      )}
    </>
  );
}

function PremiumRowActions({
  licenseId,
  licenseKey,
  organization,
  currentPlan,
  currentSubscriptionType,
  currentExpiry,
}: {
  licenseId: string;
  licenseKey: string;
  organization: string;
  currentPlan: string;
  currentSubscriptionType?: string;
  currentExpiry: Date;
}) {
  const [extendOpen, setExtendOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  async function handleRevoke() {
    setRevokeLoading(true);
    try {
      const res = await fetch("/api/premium/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to revoke premium");
        return;
      }
      window.location.reload();
    } catch {
      alert("Failed to revoke premium");
    } finally {
      setRevokeLoading(false);
    }
  }

  const isLifetime = currentSubscriptionType === "LIFETIME";

  const items: { label: string; onClick: () => void; variant?: "default" | "danger" | "primary" }[] = [
    { label: "Extend", onClick: () => setExtendOpen(true) },
    ...(!isLifetime
      ? [{ label: "Convert to Lifetime", onClick: () => setConvertOpen(true) }]
      : []),
    { label: "Change Plan", onClick: () => setChangePlanOpen(true) },
    { label: revokeLoading ? "Revoking..." : "Revoke", onClick: handleRevoke, variant: "danger" as const },
  ];

  return (
    <>
      <ActionMenu items={items} />
      <ExtendPremiumModal licenseId={licenseId} organization={organization} open={extendOpen} onClose={() => setExtendOpen(false)} />
      <ConvertToLifetimeModal
        licenseId={licenseId}
        licenseKey={licenseKey}
        organization={organization}
        currentPlan={currentPlan}
        currentSubscriptionType={currentSubscriptionType || "MONTHLY"}
        currentExpiry={currentExpiry}
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
      />
      <ChangePremiumPlanModal
        licenseId={licenseId}
        currentPlan={currentPlan}
        currentSubscriptionType={currentSubscriptionType || "MONTHLY"}
        currentExpiry={currentExpiry}
        organization={organization}
        open={changePlanOpen}
        onClose={() => setChangePlanOpen(false)}
      />
    </>
  );
}
