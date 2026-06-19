"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, ROLE_PRICES as FALLBACK_PRICES } from "@/lib/constants";
import { getRolePrice, getRoleHierarchyLevel, getDefaultPermissions, getPermissionCounts, getCategoryCounts, calculateCosts } from "@/lib/permissions";
import { User, Shield, FileText, CheckCircle, ArrowRight, DollarSign, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";

interface EditMemberModalProps {
  member: {
    id: string;
    name: string;
    email: string;
    roleId: string;
    status: string;
    licenseId?: string | null;
    lastLogin?: string | null;
  };
  roles: { id: string; name: string }[];
}

export default function EditMemberModal({ member, roles }: EditMemberModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [roleId, setRoleId] = useState(member.roleId);
  const [status, setStatus] = useState(member.status);
  const [notes, setNotes] = useState("");
  const [rolePricing, setRolePricing] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/roles/pricing")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const map: Record<string, number> = {};
          data.data.forEach((item: { role: string; price: number }) => { map[item.role] = item.price; });
          setRolePricing(map);
        }
      })
      .catch(() => {});
  }, [open]);

  const roleName = roles.find((r) => r.id === roleId)?.name ?? "";
  const originalRoleName = roles.find((r) => r.id === member.roleId)?.name ?? "";
  const hasChanges = name !== member.name || email !== member.email || roleId !== member.roleId || status !== member.status;

  const originalCosts = useMemo(() => calculateCosts(originalRoleName), [originalRoleName]);
  const newCosts = useMemo(() => calculateCosts(roleName), [roleName]);
  const costDiff = newCosts.grandTotal - originalCosts.grandTotal;

  const originalCounts = useMemo(() => getPermissionCounts(originalRoleName), [originalRoleName]);
  const newCounts = useMemo(() => getPermissionCounts(roleName), [roleName]);
  const permDiff = newCounts.default - originalCounts.default;

  function resetAndClose() {
    setStep(1);
    setError("");
    setNotes("");
    setOpen(false);
  }

  async function handleSave() {
    setError("");
    if (!name.trim()) { setError("Name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }

    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.UPDATE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, name, email, roleId, status, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }
      resetAndClose();
      router.refresh();
    } catch {
      setError("Failed to update team member");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="ghost" size="sm">
        Edit
      </ActionButton>

      <Modal
        open={open}
        onClose={resetAndClose}
        title="Edit Team Member"
        description={`Update details for ${member.name}.`}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {[1, 2, 3].map((s) => (
                <span key={s} className={`flex items-center gap-1 ${step === s ? "text-blue-400" : ""}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    step === s ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
                  }`}>{s}</span>
                  {s < 3 && <ArrowRight size={12} />}
                </span>
              ))}
            </div>
            <div className="flex gap-3">
              {step > 1 ? (
                <ActionButton variant="secondary" onClick={() => setStep(step - 1)} disabled={loading}>
                  Back
                </ActionButton>
              ) : (
                <ActionButton variant="secondary" onClick={resetAndClose} disabled={loading}>
                  Cancel
                </ActionButton>
              )}
              {step < 3 ? (
                <ActionButton onClick={() => setStep(step + 1)} disabled={loading}>
                  Next
                </ActionButton>
              ) : (
                <ActionButton onClick={handleSave} loading={loading}>
                  Save Changes
                </ActionButton>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">1</span>
                <h4 className="text-sm font-semibold">Member Info</h4>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Name</p>
                    <p className="text-sm text-zinc-200">{member.name}</p>
                  </div>
                </div>
                <div className="h-px bg-zinc-800" />
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Email</p>
                    <p className="text-sm text-zinc-200">{member.email}</p>
                  </div>
                </div>
                <div className="h-px bg-zinc-800" />
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Role</p>
                    <p className="text-sm text-zinc-200">{originalRoleName}</p>
                    <p className="text-[10px] text-zinc-500">${originalCosts.seatCost.toLocaleString()}/mo &middot; {originalCounts.default} permissions</p>
                  </div>
                </div>
                <div className="h-px bg-zinc-800" />
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-zinc-500" />
                  <div>
                    <p className="text-xs text-zinc-500">Status</p>
                    <p className="text-sm text-zinc-200">{member.status}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">2</span>
                <h4 className="text-sm font-semibold">Edit Fields</h4>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Full Name</label>
                <input
                  type="text" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email Address</label>
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  {roles.map((r) => {
                    const upper = r.name.toUpperCase().replace(/\s+/g, "_");
                    const rp = (rolePricing ?? FALLBACK_PRICES)[upper] ?? getRolePrice(r.name);
                    const rc = getPermissionCounts(r.name);
                    const level = getRoleHierarchyLevel(r.name);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} (${rp.toLocaleString()}/mo - Lv{level} - {rc.default} perms)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">3</span>
                  <h4 className="text-sm font-semibold">Notes / Reason for Change</h4>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Reason (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Provide a reason for this change..."
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                <h4 className="text-sm font-semibold">Impact Summary</h4>
                <div className="space-y-2 text-sm">
                  {name !== member.name && (
                    <div className="flex items-center gap-2 text-zinc-300">
                      <User size={14} className="text-blue-400" />
                      <span>Name: <span className="text-zinc-500 line-through">{member.name}</span> → <span className="text-zinc-100">{name}</span></span>
                    </div>
                  )}
                  {email !== member.email && (
                    <div className="flex items-center gap-2 text-zinc-300">
                      <FileText size={14} className="text-blue-400" />
                      <span>Email: <span className="text-zinc-500 line-through">{member.email}</span> → <span className="text-zinc-100">{email}</span></span>
                    </div>
                  )}
                  {roleId !== member.roleId && (
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Shield size={14} className="text-blue-400" />
                      <span>Role: <span className="text-zinc-500 line-through">{originalRoleName}</span> → <span className="text-zinc-100">{roleName}</span></span>
                    </div>
                  )}
                  {status !== member.status && (
                    <div className="flex items-center gap-2 text-zinc-300">
                      <CheckCircle size={14} className="text-blue-400" />
                      <span>Status: <span className="text-zinc-500 line-through">{member.status}</span> → <span className="text-zinc-100">{status}</span></span>
                    </div>
                  )}
                  {!hasChanges && (
                    <p className="text-zinc-500">No changes detected.</p>
                  )}
                </div>
              </div>

              {roleId !== member.roleId && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-5 space-y-4">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-amber-300">
                    <DollarSign size={14} />
                    Cost Impact
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                      <span className="text-[10px] text-zinc-500">Current Role</span>
                      <p className="text-sm font-semibold text-zinc-100">{originalRoleName}</p>
                      <p className="text-xs text-zinc-400">${originalCosts.seatCost.toLocaleString()}/mo</p>
                      <p className="text-[10px] text-zinc-500">Level {getRoleHierarchyLevel(originalRoleName)} &middot; {originalCounts.default} perms</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight size={20} className="text-zinc-500" />
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5">
                      <span className="text-[10px] text-zinc-500">New Role</span>
                      <p className="text-sm font-semibold text-zinc-100">{roleName}</p>
                      <p className="text-xs text-zinc-400">${newCosts.seatCost.toLocaleString()}/mo</p>
                      <p className="text-[10px] text-zinc-500">Level {getRoleHierarchyLevel(roleName)} &middot; {newCounts.default} perms</p>
                    </div>
                  </div>

                  {/* Cost Breakdown Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-3 py-2.5">
                      <span className="text-[10px] text-zinc-500">Current Cost</span>
                      <p className="text-sm font-semibold text-zinc-100">${originalCosts.grandTotal.toFixed(2)}/mo</p>
                      <div className="text-[10px] text-zinc-500">
                        Seat: ${originalCosts.seatCost.toLocaleString()} | Access: ${originalCosts.accessCost.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-3 py-2.5">
                      <span className="text-[10px] text-zinc-500">New Cost</span>
                      <p className="text-sm font-semibold text-zinc-100">${newCosts.grandTotal.toFixed(2)}/mo</p>
                      <div className="text-[10px] text-zinc-500">
                        Seat: ${newCosts.seatCost.toLocaleString()} | Access: ${newCosts.accessCost.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Permission Change */}
                  {permDiff !== 0 && (
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Permission Change</span>
                        <span className={`text-xs font-semibold ${permDiff > 0 ? "text-green-400" : "text-red-400"}`}>
                          {permDiff > 0 ? "+" : ""}{permDiff} permissions
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Grand Total Difference</span>
                      <div className="flex items-center gap-1.5">
                        {costDiff > 0 ? (
                          <ArrowUpRight size={14} className="text-red-400" />
                        ) : costDiff < 0 ? (
                          <ArrowDownRight size={14} className="text-green-400" />
                        ) : null}
                        <span className={`text-sm font-semibold ${
                          costDiff > 0 ? "text-red-400" : costDiff < 0 ? "text-green-400" : "text-zinc-300"
                        }`}>
                          {costDiff > 0 ? "+$" : "-$"}{Math.abs(costDiff).toFixed(2)}/mo
                        </span>
                      </div>
                    </div>
                    {costDiff !== 0 && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
                        <div
                          className={`h-full rounded-full transition-all ${costDiff > 0 ? "bg-red-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(Math.abs(costDiff) / (originalCosts.grandTotal || 1) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Permission Summary */}
              {roleId !== member.roleId && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Shield size={14} className="text-purple-400" />
                    Permission Summary
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                      <span className="block text-[9px] text-zinc-500">Current Granted</span>
                      <span className="text-sm font-semibold text-zinc-200">{originalCounts.default}/{originalCounts.total}</span>
                    </div>
                    <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                      <span className="block text-[9px] text-zinc-500">New Granted</span>
                      <span className="text-sm font-semibold text-zinc-200">{newCounts.default}/{newCounts.total}</span>
                    </div>
                    <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                      <span className="block text-[9px] text-zinc-500">Change</span>
                      <span className={`text-sm font-semibold ${permDiff > 0 ? "text-green-400" : permDiff < 0 ? "text-red-400" : "text-zinc-400"}`}>
                        {permDiff > 0 ? "+" : ""}{permDiff}
                      </span>
                    </div>
                    <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                      <span className="block text-[9px] text-zinc-500">Coverage</span>
                      <span className="text-sm font-semibold text-blue-400">{newCounts.coveragePercent}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Preview */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Audit Preview</span>
                </div>
                <pre className="font-mono text-xs text-zinc-400">
{JSON.stringify({
  action: "UPDATE_MEMBER",
  target: member.email,
  hierarchy: roleId !== member.roleId ? {
    from: { role: originalRoleName, level: getRoleHierarchyLevel(originalRoleName) },
    to: { role: roleName, level: getRoleHierarchyLevel(roleName) },
  } : undefined,
  changes: {
    ...(name !== member.name && { name }),
    ...(email !== member.email && { email }),
    ...(roleId !== member.roleId && {
      role: { from: originalRoleName, to: roleName, fromLevel: getRoleHierarchyLevel(originalRoleName), toLevel: getRoleHierarchyLevel(roleName) },
      cost: { from: originalCosts.grandTotal, to: newCosts.grandTotal, diff: costDiff },
      permissions: { from: originalCounts.default, to: newCounts.default, diff: permDiff },
      coverage: { from: originalCounts.coveragePercent, to: newCounts.coveragePercent },
    }),
    ...(status !== member.status && { status }),
  },
  reason: notes || "N/A",
}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
