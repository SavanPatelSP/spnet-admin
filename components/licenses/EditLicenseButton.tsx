"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PLANS, LICENSE_STATUSES } from "@/lib/constants";
import type { LicenseWithActivations } from "@/types/common";
import { Pencil } from "lucide-react";

interface Props {
  license: LicenseWithActivations;
  size?: "sm" | "md";
}

export default function EditLicenseButton({ license, size = "md" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [organization, setOrganization] = useState(license.organization);
  const [plan, setPlan] = useState(license.plan);
  const [status, setStatus] = useState(license.status);
  const [maxDevices, setMaxDevices] = useState(license.maxDevices);
  const [notes, setNotes] = useState(license.notes ?? "");
  const [expiresAt, setExpiresAt] = useState(new Date(license.expiresAt).toISOString().split("T")[0]);

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
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="primary" onClick={save} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Organization</label>
            <input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Max Devices</label>
              <input
                type="number"
                min="1"
                value={maxDevices}
                onChange={(e) => setMaxDevices(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Expiry Date</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
              >
                {LICENSE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
