"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES, PLANS, LICENSE_STATUSES } from "@/lib/constants";
import type { License } from "@prisma/client";
import { Pencil, Shield, Cpu, Calendar, FileText, ArrowRight } from "lucide-react";

interface Props {
  license: License;
  size?: "sm" | "md";
}

export default function EditLicenseButton({ license, size = "md" }: Props) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [organization, setOrganization] = useState(license.organization);
  const [plan, setPlan] = useState(license.plan);
  const [status, setStatus] = useState(license.status);
  const [maxDevices, setMaxDevices] = useState(license.maxDevices);
  const [notes, setNotes] = useState(license.notes ?? "");
  const [expiresAt, setExpiresAt] = useState(new Date(license.expiresAt).toISOString().split("T")[0]);

  const hasPermissionToEdit = hasPermission("Edit Licenses");
  if (!hasPermissionToEdit && !open) return null;

  const hasChanges = organization !== license.organization || plan !== license.plan || status !== license.status || maxDevices !== license.maxDevices || notes !== (license.notes ?? "") || expiresAt !== new Date(license.expiresAt).toISOString().split("T")[0];

  async function save() {
    setError("");
    if (!organization.trim()) {
      setError("Organization name is required");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.UPDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: license.id, organization, plan, status, maxDevices, expiresAt, notes }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to update license");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to update license");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="ghost" size={size}>
        <Pencil size={14} /> Edit
      </ActionButton>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit License"
        description={`Editing ${license.key}`}
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={save} loading={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Current Values */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">1</span>
              <h4 className="text-sm font-semibold">Current Values</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">Organization</span>
                <p className="font-medium text-zinc-200">{license.organization}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">License Key</span>
                <p className="font-mono text-xs text-zinc-300">{license.key}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">Plan</span>
                <p className="font-medium text-zinc-200">{license.plan}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">Status</span>
                <p className="font-medium text-zinc-200">{license.status}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">Max Devices</span>
                <p className="font-medium text-zinc-200">{license.maxDevices}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
                <span className="text-xs text-zinc-500">Expiry</span>
                <p className="font-medium text-zinc-200">{new Date(license.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Step 2: Edit Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">2</span>
              <h4 className="text-sm font-semibold">Edit Configuration</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Shield className="mr-1 inline" size={12} />
                  Organization
                </label>
                <input value={organization} onChange={(e) => setOrganization(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    <Cpu className="mr-1 inline" size={12} />
                    Plan
                  </label>
                  <select value={plan} onChange={(e) => setPlan(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500">
                    {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {PLANS.map((p) => (
                      <button key={p} type="button" onClick={() => setPlan(p)}
                        className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${plan === p ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Max Devices</label>
                  <input type="number" min="1" value={maxDevices}
                    onChange={(e) => setMaxDevices(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500">
                    {LICENSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    <Calendar className="mr-1 inline" size={12} />
                    Expiry Date
                  </label>
                  <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Notes */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">3</span>
              <h4 className="text-sm font-semibold">Notes</h4>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <FileText className="mr-1 inline" size={12} />
                Notes (optional)
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
            </div>
          </div>

          {/* Comparison */}
          {hasChanges && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">
                  <ArrowRight size={12} />
                </span>
                <h4 className="text-sm font-semibold">Changes</h4>
              </div>
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-800/30">
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Field</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Current</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">New</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {organization !== license.organization && (
                      <tr>
                        <td className="px-3 py-2 text-zinc-400">Organization</td>
                        <td className="px-3 py-2 text-zinc-500">{license.organization}</td>
                        <td className="px-3 py-2 text-blue-400">{organization}</td>
                      </tr>
                    )}
                    {plan !== license.plan && (
                      <tr>
                        <td className="px-3 py-2 text-zinc-400">Plan</td>
                        <td className="px-3 py-2 text-zinc-500">{license.plan}</td>
                        <td className="px-3 py-2 text-blue-400">{plan}</td>
                      </tr>
                    )}
                    {status !== license.status && (
                      <tr>
                        <td className="px-3 py-2 text-zinc-400">Status</td>
                        <td className="px-3 py-2 text-zinc-500">{license.status}</td>
                        <td className="px-3 py-2 text-blue-400">{status}</td>
                      </tr>
                    )}
                    {maxDevices !== license.maxDevices && (
                      <tr>
                        <td className="px-3 py-2 text-zinc-400">Max Devices</td>
                        <td className="px-3 py-2 text-zinc-500">{license.maxDevices}</td>
                        <td className="px-3 py-2 text-blue-400">{maxDevices}</td>
                      </tr>
                    )}
                    {expiresAt !== new Date(license.expiresAt).toISOString().split("T")[0] && (
                      <tr>
                        <td className="px-3 py-2 text-zinc-400">Expiry</td>
                        <td className="px-3 py-2 text-zinc-500">{new Date(license.expiresAt).toISOString().split("T")[0]}</td>
                        <td className="px-3 py-2 text-blue-400">{expiresAt}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Audit Preview</span>
            </div>
            <pre className="font-mono text-xs text-zinc-300">
{`ACTION: LICENSE_UPDATED
LICENSE_KEY: ${license.key}
ORGANIZATION: ${organization}
PLAN: ${plan}
STATUS: ${status}
MAX_DEVICES: ${maxDevices}
EXPIRES: ${expiresAt}
NOTES: ${notes || "none"}`}
            </pre>
          </div>
        </div>
      </Modal>
    </>
  );
}
