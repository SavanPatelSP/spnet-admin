"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES } from "@/lib/constants";
import { formatNumber } from "@/lib/shared";
import { Building2, FileText, ArrowRight } from "lucide-react";

interface LicenseSummary {
  id: string;
  key: string;
  plan: string;
  status: string;
}

interface OrgStats {
  licenseCount: number;
  activeCount: number;
  deviceCount: number;
  totalCoins: number;
  totalGems: number;
  premiumCount: number;
}

interface Props {
  organization: string;
  licenses?: LicenseSummary[];
  stats?: OrgStats;
  open?: boolean;
  onClose?: () => void;
}

export default function EditOrganizationModal({
  organization, licenses: initialLicenses, stats, open: externalOpen, onClose: externalOnClose,
}: Props) {
  const { hasPermission } = usePermission();
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    if (!v) externalOnClose?.();
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newOrgName, setNewOrgName] = useState(organization);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => {
        setNewOrgName(organization);
        setNotes("");
        setError("");
      }, 0);
      return () => clearTimeout(id);
    }
  }, [open, organization]);

  const hasOrgNameChanged = newOrgName.trim() !== organization;
  const valid = newOrgName.trim();

  async function handleSave() {
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.LICENSES.UPDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialLicenses?.[0]?.id,
          organization: newOrgName.trim(),
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update organization");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to update organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {externalOpen === undefined && hasPermission("Edit Licenses") && (
        <ActionButton onClick={() => setOpen(true)} variant="secondary" size="sm">
          Edit Organization
        </ActionButton>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Organization"
        description={`Manage configuration for ${organization}.`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={handleSave} disabled={loading || !valid}>
              {loading ? "Saving..." : "Save Changes"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Current Overview */}
          {stats && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
                <h4 className="text-sm font-semibold text-zinc-100">Current Overview</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
                  <div className="text-lg font-bold text-zinc-100">{stats.licenseCount}</div>
                  <div className="text-xs text-zinc-500">Licenses</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
                  <div className="text-lg font-bold text-green-400">{stats.activeCount}</div>
                  <div className="text-xs text-zinc-500">Active</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
                  <div className="text-lg font-bold text-zinc-100">{stats.deviceCount}</div>
                  <div className="text-xs text-zinc-500">Devices</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
                  <div className="text-lg font-bold text-amber-400">{formatNumber(stats.totalCoins)}</div>
                  <div className="text-xs text-zinc-500">Coins</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
                  <div className="text-lg font-bold text-purple-400">{formatNumber(stats.totalGems)}</div>
                  <div className="text-xs text-zinc-500">Gems</div>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
                  <div className="text-lg font-bold text-cyan-400">{stats.premiumCount}</div>
                  <div className="text-xs text-zinc-500">Premium</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Edit Details */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
              <h4 className="text-sm font-semibold text-zinc-100">Organization Details</h4>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Organization Name</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Organization name"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
            </div>

            {hasOrgNameChanged && (
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <span className="text-zinc-400">{organization}</span>
                  <ArrowRight size={12} className="text-zinc-500" />
                  <span className="font-medium text-amber-300">{newOrgName.trim()}</span>
                </div>
              </div>
            )}

            {initialLicenses && initialLicenses.length > 0 && (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Licenses under this organization</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {initialLicenses.map((lic) => (
                    <div key={lic.id} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                      <span className="font-mono text-xs text-zinc-300">{lic.key}</span>
                      <span className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">{lic.plan}</span>
                      <span className={`ml-auto text-[10px] ${lic.status === "ACTIVE" ? "text-green-400" : "text-zinc-500"}`}>{lic.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="text-sm font-semibold text-zinc-100">Notes (optional)</h4>
            </div>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-3 text-zinc-500" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for changes..."
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
                <span className="text-yellow-400">ORGANIZATION_UPDATED</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Organization</span>
                <span className="text-zinc-300">{organization}</span>
              </div>
              {hasOrgNameChanged && (
                <div className="flex">
                  <span className="w-28 text-zinc-500">New Name</span>
                  <span className="text-amber-400">{newOrgName.trim()}</span>
                </div>
              )}
              <div className="flex">
                <span className="w-28 text-zinc-500">Licenses</span>
                <span className="text-zinc-300">{initialLicenses?.length || 0} affected</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
