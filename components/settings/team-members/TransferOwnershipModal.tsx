"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";


interface Props {
  open: boolean;
  onClose: () => void;
  members: { id: string; name: string; email: string }[];
  currentOwner: { id: string; name: string; email: string };
}

export default function TransferOwnershipModal({ open, onClose, members, currentOwner }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eligibleMembers = members.filter((m) => m.id !== currentOwner.id);

  async function handleTransfer() {
    if (!selectedId) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/team-members/transfer-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMemberId: selectedId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Transfer failed");
      } else {
        onClose();
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Transfer Ownership">
      <div className="space-y-4">
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3">
          <p className="text-sm text-yellow-400">
            Current owner: <strong>{currentOwner.name}</strong> ({currentOwner.email})
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Ownership will be transferred immediately. The current owner will be reassigned to the Admin role.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">Select New Owner</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-200 outline-none focus:border-blue-500"
          >
            <option value="">Choose a team member...</option>
            {eligibleMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3">
          <ActionButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </ActionButton>
          <ActionButton onClick={handleTransfer} variant="danger" disabled={!selectedId || loading} loading={loading}>
            Transfer Ownership
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
}
