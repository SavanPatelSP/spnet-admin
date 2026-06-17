"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { ArrowRightLeft } from "lucide-react";

interface Props {
  licenseId: string;
  currentOrganization: string;
}

export default function LicenseTransferButton({ licenseId, currentOrganization }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newOrganization, setNewOrganization] = useState("");
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
        onClose={() => { if (!loading) { setOpen(false); setError(""); } }}
        title="Transfer License"
        description={`Current: ${currentOrganization}`}
        size="sm"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => { setOpen(false); setError(""); }} disabled={loading}>Cancel</ActionButton>
            <ActionButton variant="primary" onClick={transfer} disabled={loading}>
              {loading ? "Transferring..." : "Transfer"}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">New Organization</label>
            <input value={newOrganization} onChange={(e) => setNewOrganization(e.target.value)}
              placeholder="Enter new organization name"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500" />
          </div>
        </div>
      </Modal>
    </>
  );
}
