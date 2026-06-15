"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PLANS, LICENSE_STATUSES, DEFAULT_PLAN, DEFAULT_MAX_DEVICES } from "@/lib/constants";

const defaultExpiry = `${new Date().getFullYear() + 3}-12-31`;

export default function CreateLicenseModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [organization, setOrganization] = useState("");
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [maxDevices, setMaxDevices] = useState(DEFAULT_MAX_DEVICES);
  const [status, setStatus] = useState("ACTIVE");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry);
  const [notes, setNotes] = useState("");

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
        body: JSON.stringify({ organization, plan, maxDevices, status, expiresAt, notes }),
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
      setExpiresAt(defaultExpiry);
      setNotes("");
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
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Organization</label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none transition-colors focus:border-blue-500"
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
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Notes (optional)</label>
            <textarea
              placeholder="Additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none transition-colors focus:border-blue-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
