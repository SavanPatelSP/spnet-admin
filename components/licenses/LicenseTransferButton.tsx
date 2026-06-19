"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { ArrowRightLeft, Building2, Key, FileText, ArrowRight } from "lucide-react";

interface Props {
  licenseId: string;
  currentOrganization: string;
}

export default function LicenseTransferButton({ licenseId, currentOrganization }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newOrganization, setNewOrganization] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function transfer() {
    setError("");
    if (!newOrganization.trim()) { setError("New organization name is required"); return; }
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.TRANSFER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId, newOrganization: newOrganization.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Transfer failed");
        return;
      }
      setOpen(false);
      setNewOrganization("");
      setNotes("");
      router.refresh();
    } catch {
      setError("Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="ghost" size="sm">
        <ArrowRightLeft size={14} /> Transfer
      </ActionButton>

      <Modal
        open={open}
        onClose={() => { if (!loading) { setOpen(false); setError(""); setNotes(""); } }}
        title="Transfer License"
        description="Move license to a different organization."
        size="lg"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => { setOpen(false); setError(""); setNotes(""); }} disabled={loading}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={transfer} loading={loading}>
              {loading ? "Transferring..." : "Transfer"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* Step 1: Source License */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">1</span>
              <h4 className="text-sm font-semibold">Source License</h4>
            </div>
            <div className="rounded-lg bg-zinc-800/30 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <Building2 size={14} />
                <span className="text-xs">Organization</span>
              </div>
              <p className="mt-0.5 font-medium text-zinc-200">{currentOrganization}</p>
              <div className="mt-2 flex items-center gap-2 text-zinc-500">
                <Key size={14} />
                <span className="text-xs">License ID</span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-zinc-300">{licenseId}</p>
            </div>
          </div>

          {/* Step 2: Transfer Target */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">2</span>
              <h4 className="text-sm font-semibold">Transfer Target</h4>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <Building2 className="mr-1 inline" size={12} />
                New Organization
              </label>
              <input value={newOrganization} onChange={(e) => setNewOrganization(e.target.value)}
                placeholder="Enter new organization name"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
              <p className="mt-1.5 text-xs text-zinc-500">License will be transferred from <strong className="text-zinc-400">{currentOrganization}</strong> to the organization above.</p>
            </div>
          </div>

          {/* Step 3: Reason */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">3</span>
              <h4 className="text-sm font-semibold">Reason</h4>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <FileText className="mr-1 inline" size={12} />
                Notes (optional)
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={2} placeholder="Reason for transfer..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500" />
            </div>
          </div>

          {/* Impact Summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">
                <ArrowRight size={12} />
              </span>
              <h4 className="text-sm font-semibold">Impact Summary</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Source</span>
                <p className="font-semibold text-zinc-200">{currentOrganization}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
                <span className="text-xs text-zinc-500">Target</span>
                <p className="font-semibold text-zinc-200">{newOrganization || "-"}</p>
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
{`ACTION: LICENSE_TRANSFERRED
LICENSE_ID: ${licenseId}
FROM: ${currentOrganization}
TO: ${newOrganization || "(not set)"}
NOTES: ${notes || "none"}`}
            </pre>
          </div>
        </div>
      </Modal>
    </>
  );
}
