"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { UserMinus, Users, AlertTriangle, CheckCircle, ArrowRight, Search } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  members: { id: string; name: string; email: string }[];
  currentOwner: { id: string; name: string; email: string };
}

export default function TransferOwnershipModal({ open, onClose, members, currentOwner }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eligibleMembers = members.filter((m) => m.id !== currentOwner.id);
  const filteredMembers = eligibleMembers.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );
  const targetMember = members.find((m) => m.id === selectedId);

  function resetAndClose() {
    setStep(1);
    setSelectedId("");
    setSearch("");
    setAcknowledged(false);
    setError("");
    onClose();
  }

  async function handleTransfer() {
    if (!selectedId || !acknowledged) return;
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
        resetAndClose();
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose} title="Transfer Ownership" size="lg">
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
              <h4 className="text-sm font-semibold">Current Owner</h4>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <UserMinus size={16} className="text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-500">Current Owner</p>
                  <p className="text-sm font-medium text-zinc-200">{currentOwner.name}</p>
                  <p className="text-xs text-zinc-500">{currentOwner.email}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-400" />
                <p className="text-sm text-yellow-400">
                  Ownership transfer is irreversible. The current owner will be reassigned to the Admin role.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">2</span>
              <h4 className="text-sm font-semibold">Select New Owner</h4>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team members..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 pl-9 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">No members found</p>
              ) : (
                filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedId(m.id); setSearch(""); }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selectedId === m.id
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      selectedId === m.id ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-200">{m.name}</p>
                      <p className="text-xs text-zinc-500">{m.email}</p>
                    </div>
                    {selectedId === m.id && <CheckCircle size={16} className="text-blue-400" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">3</span>
                <h4 className="text-sm font-semibold">Confirmation</h4>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
                <p className="text-sm font-medium text-zinc-200">Impact Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <UserMinus size={14} className="text-yellow-400" />
                    <span><span className="text-zinc-500">Owner:</span> {currentOwner.name} → <span className="text-zinc-100">{targetMember?.name}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Users size={14} className="text-yellow-400" />
                    <span><span className="text-zinc-500">Previous Owner Role:</span> <span className="text-zinc-100">Admin</span></span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Irreversible Action</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      This action cannot be undone. Ownership will be transferred immediately and the current owner will lose all owner privileges.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-400">
                  I acknowledge that this action is irreversible and the current owner will be reassigned to the Admin role.
                </span>
              </label>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Audit Preview</span>
              </div>
              <pre className="font-mono text-xs text-zinc-400">
{JSON.stringify({ action: "TRANSFER_OWNERSHIP", from: currentOwner.email, to: targetMember?.email ?? "N/A", timestamp: new Date().toISOString() }, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
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
              <ActionButton
                onClick={() => setStep(step + 1)}
                disabled={(step === 2 && !selectedId) || loading}
              >
                Next
              </ActionButton>
            ) : (
              <ActionButton
                onClick={handleTransfer}
                variant="danger"
                disabled={!selectedId || !acknowledged || loading}
                loading={loading}
              >
                Transfer Ownership
              </ActionButton>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
