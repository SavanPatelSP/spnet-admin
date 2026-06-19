"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { API_ROUTES, LICENSE_TIERS } from "@/lib/constants";
import { getRolePrice, getPermissionCounts, calculateCosts } from "@/lib/permissions";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { formatDate } from "@/lib/shared";
import {
  User, Mail, Shield, Building2, Key, Calendar, Check, Copy,
  DollarSign, Users, Zap, TrendingUp, ArrowLeft,
} from "lucide-react";

interface Role {
  id: string;
  name: string;
}

interface LicenseTemplate {
  id: string;
  name: string;
  plan: string;
  maxDevices: number;
  durationDays: number;
  featureFlags: string | null;
}

interface Props {
  roles: Role[];
  templates: LicenseTemplate[];
}

export default function CreateTeamMemberLicenseForm({ roles, templates }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [organization, setOrganization] = useState("");
  const [tierLabel, setTierLabel] = useState(LICENSE_TIERS[0].label);
  const [maxDevices, setMaxDevices] = useState(LICENSE_TIERS[0].maxDevices);
  const [durationDays, setDurationDays] = useState(LICENSE_TIERS[0].durationDays);
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    member: { name: string; email: string };
    license: { key: string };
    inviteLink: string | null;
    tempPassword: string | null;
  } | null>(null);

  const selectedRole = roles.find((r) => r.id === roleId);
  const tier = LICENSE_TIERS.find((t) => t.label === tierLabel) || LICENSE_TIERS[0];

  function handleTierChange(newLabel: string) {
    const newTier = LICENSE_TIERS.find((t) => t.label === newLabel) || LICENSE_TIERS[0];
    setTierLabel(newLabel);
    setMaxDevices(newTier.maxDevices);
    setDurationDays(newTier.durationDays);
    if (!expiresAt) {
      const d = new Date();
      d.setDate(d.getDate() + newTier.durationDays);
      setExpiresAt(d.toISOString().split("T")[0]);
    }
  }
  const roleCounts = selectedRole ? getPermissionCounts(selectedRole.name) : { total: 0, default: 0 };
  const { seatCost, accessCost, grandTotal: roleTotal } = selectedRole
    ? calculateCosts(selectedRole.name, roleCounts.default)
    : { seatCost: 0, accessCost: 0, grandTotal: 0 };

  const licenseValue = tier.price;
  const teamMemberCost = roleTotal;
  const totalCost = licenseValue + teamMemberCost;
  const revenueImpact = licenseValue;

  const expiryDate = useMemo(() => {
    if (expiresAt) return new Date(expiresAt);
    const d = new Date();
    d.setDate(d.getDate() + durationDays);
    return d;
  }, [expiresAt, durationDays]);

  const valid = name.trim() && email.trim() && roleId && organization.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.CREATE_WITH_LICENSE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          roleId,
          organization: organization.trim(),
          plan: tier.label,
          maxDevices,
          expiresAt,
          notes,
          sendInvite,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to create team member and license");
        return;
      }
      setResult(data.data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard"));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">Team Member Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Role</label>
              <div className="relative">
                <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Organization</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Acme Inc"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">License Configuration</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">License Tier</label>
              <div className="relative">
                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <select
                  value={tierLabel}
                  onChange={(e) => handleTierChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  {LICENSE_TIERS.map((t) => (
                    <option key={t.label} value={t.label}>{t.label} — ${t.price}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Max Devices</label>
              <input
                type="number"
                value={maxDevices}
                onChange={(e) => setMaxDevices(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration (days)</label>
              <input
                type="number"
                value={durationDays}
                onChange={(e) => {
                  const days = Number(e.target.value);
                  setDurationDays(days);
                  const d = new Date();
                  d.setDate(d.getDate() + days);
                  setExpiresAt(d.toISOString().split("T")[0]);
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Expiry Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
            <input
              id="sendInvite"
              type="checkbox"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-blue-500"
            />
            <label htmlFor="sendInvite" className="text-sm text-zinc-300">
              Send invite email and create onboarding record
            </label>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-700"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            type="submit"
            disabled={loading || !valid}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : <><Check size={16} /> Create Member & License</>}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <TrendingUp size={14} /> Live Calculations
          </h3>
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-zinc-400">
                <Users size={14} /> <span className="text-xs font-medium uppercase">Team Member Cost</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Role ({selectedRole?.name || "—"})</span>
                  <span className="text-zinc-200">${seatCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Access ({roleCounts.default} perms)</span>
                  <span className="text-zinc-200">${accessCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-700 pt-2 font-semibold text-zinc-200">
                  <span>Subtotal</span>
                  <span>${teamMemberCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-zinc-400">
                <Key size={14} /> <span className="text-xs font-medium uppercase">License Value</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Tier ({tier.label})</span>
                  <span className="text-zinc-200">${licenseValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Devices</span>
                  <span className="text-zinc-200">{maxDevices}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Expires</span>
                  <span className="text-zinc-200">{formatDate(expiryDate)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-emerald-400">
                <DollarSign size={14} /> <span className="text-xs font-medium uppercase">Value Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Revenue Impact</span>
                  <span className="text-emerald-400">+${revenueImpact.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Cost Impact</span>
                  <span className="text-red-400">-${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-700 pt-2 font-bold text-zinc-100">
                  <span>Total Cost</span>
                  <span>${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Zap size={14} /> Auto Generation
          </h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2"><Check size={12} className="text-emerald-400" /> Team Member</li>
            <li className="flex items-center gap-2"><Check size={12} className="text-emerald-400" /> License Key</li>
            <li className="flex items-center gap-2"><Check size={12} className="text-emerald-400" /> License Assignment</li>
            <li className="flex items-center gap-2"><Check size={12} className="text-emerald-400" /> Invite Link</li>
            <li className="flex items-center gap-2"><Check size={12} className="text-emerald-400" /> Onboarding Record</li>
            <li className="flex items-center gap-2"><Check size={12} className="text-emerald-400" /> Invoice</li>
          </ul>
        </div>
      </div>

      <Modal
        open={!!result}
        onClose={() => { setResult(null); router.push("/settings/team-members"); }}
        title="Onboarding Complete"
        description="Team member, license, and invite have been created."
        size="md"
        footer={
          <ActionButton onClick={() => { setResult(null); router.push("/settings/team-members"); }} variant="primary">
            Done
          </ActionButton>
        }
      >
        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4">
              <p className="text-xs text-zinc-500">Member</p>
              <p className="text-sm font-medium text-zinc-200">{result.member.name} ({result.member.email})</p>
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4">
              <p className="text-xs text-zinc-500">License Key</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-zinc-200">{result.license.key}</code>
                <button onClick={() => copy(result.license.key)} className="rounded bg-blue-500/10 p-1.5 text-blue-400 hover:bg-blue-500/20">
                  <Copy size={12} />
                </button>
              </div>
            </div>
            {result.inviteLink && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs text-emerald-400">Invite Link</p>
                <div className="mt-1 flex items-center gap-2">
                  <input readOnly value={result.inviteLink} className="flex-1 bg-transparent text-xs text-zinc-300 outline-none" />
                {result.inviteLink && (
                  <button onClick={() => copy(result.inviteLink!)} className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20">
                    Copy
                  </button>
                )}
                </div>
              </div>
            )}
            {result.tempPassword && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <p className="text-xs text-yellow-400">Temporary Password</p>
                <code className="text-sm text-zinc-200">{result.tempPassword}</code>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
