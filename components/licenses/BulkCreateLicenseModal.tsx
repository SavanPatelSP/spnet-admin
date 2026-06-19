"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PLANS } from "@/lib/constants";
import { Building2, Cpu, Calendar, FileText } from "lucide-react";

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
  const [count] = useState(10);
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
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Organization */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">1</span>
              <h4 className="text-sm font-semibold">Organization</h4>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <Building2 className="mr-1 inline" size={12} />
                Organization Name
              </label>
              <input value={organization} onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
            </div>
          </div>

          {/* Step 2: Configuration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">2</span>
              <h4 className="text-sm font-semibold">Configuration</h4>
            </div>
            <div className="space-y-4">
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
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${plan === p ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}>
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
          </div>

          {/* Step 3: Expiry & Options */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">3</span>
              <h4 className="text-sm font-semibold">Expiry &amp; Options</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Calendar className="mr-1 inline" size={12} />
                  Expiry Date (optional)
                </label>
                <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <FileText className="mr-1 inline" size={12} />
                  Template (optional)
                </label>
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500">
                  <option value="">No template</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <FileText className="mr-1 inline" size={12} />
                  Notes (optional)
                </label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">4</span>
              <h4 className="text-sm font-semibold">Summary</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Count</span>
                <p className="font-semibold text-zinc-200">{count}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Organization</span>
                <p className="font-semibold text-zinc-200">{organization || "-"}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Plan</span>
                <p className="font-semibold text-zinc-200">{plan}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Max Devices</span>
                <p className="font-semibold text-zinc-200">{maxDevices}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Expiry</span>
                <p className="font-semibold text-zinc-200">{expiresAt || "None"}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Template</span>
                <p className="font-semibold text-zinc-200">{templateId ? templates.find(t => t.id === templateId)?.name || templateId : "None"}</p>
              </div>
            </div>
          </div>

          {/* Audit Preview */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Audit Preview</span>
            </div>
            <pre className="font-mono text-xs text-zinc-300">
{`ACTION: LICENSE_BULK_CREATED
COUNT: ${count}
ORGANIZATION: ${organization || "(not set)"}
PLAN: ${plan}
MAX_DEVICES: ${maxDevices}
EXPIRES: ${expiresAt || "none"}
NOTES: ${notes || "none"}
TEMPLATE: ${templateId || "none"}`}
            </pre>
          </div>
        </div>
      )}
    </Modal>
  );
}
