"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PLANS } from "@/lib/constants";

interface Props {
  open: boolean;
  onClose: () => void;
  templates?: { id: string; name: string }[];
}

interface ResultEntry {
  key?: string;
  organization: string;
  error?: string;
}

export default function BulkCreateLicenseModal({ open, onClose, templates = [] }: Props) {
  const router = useRouter();
  const [count, setCount] = useState(10);
  const [organization, setOrganization] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxDevices, setMaxDevices] = useState(1);
  const [notes, setNotes] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ResultEntry[] | null>(null);

  async function submit() {
    setError("");
    setResults(null);
    if (!organization.trim()) { setError("Organization name is required"); return; }
    if (count < 1 || count > 1000) { setError("Count must be between 1 and 1000"); return; }
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.BULK_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          organization: organization.trim(),
          plan,
          expiresAt: expiresAt || undefined,
          maxDevices,
          notes: notes.trim() || undefined,
          templateId: templateId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Bulk creation failed");
        return;
      }
      setResults(data.results ?? []);
      router.refresh();
    } catch {
      setError("Failed to bulk create licenses");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setResults(null);
      setError("");
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk Create Licenses"
      description="Generate multiple licenses at once."
      size="lg"
      footer={
        !results ? (
          <>
            <ActionButton variant="secondary" onClick={handleClose} disabled={loading}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={submit} loading={loading}>
              {loading ? "Creating..." : "Create Licenses"}
            </ActionButton>
          </>
        ) : (
          <ActionButton variant="secondary" onClick={handleClose}>Close</ActionButton>
        )
      }
    >
      {results ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Created {results.filter((r) => r.key).length} of {results.length} licenses.
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {results.map((r, i) => (
              <div key={r.key || i} className={`rounded-lg px-3 py-2 text-sm ${r.key ? "bg-zinc-800/50 text-zinc-300" : "bg-red-900/20 text-red-400"}`}>
                {r.key ? (
                  <span><span className="font-mono">{r.key}</span> — {r.organization}</span>
                ) : (
                  <span>{r.organization}: {r.error || "Failed"}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Count (1–1000)</label>
            <input type="number" min="1" max="1000" value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Organization</label>
            <input value={organization} onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Plan</label>
              <select value={plan} onChange={(e) => setPlan(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500">
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Max Devices</label>
              <input type="number" min="1" value={maxDevices}
                onChange={(e) => setMaxDevices(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Expiry Date (optional)</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-400">Template (optional)</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500">
                <option value="">No template</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
          </div>
        </div>
      )}
    </Modal>
  );
}
