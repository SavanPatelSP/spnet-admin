"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { CheckCircle2, XCircle, FileText } from "lucide-react";

interface ApprovalActionsProps {
  requestId: string;
  title: string;
}

export default function ApprovalActions({ requestId, title }: ApprovalActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setApproveOpen(true)}
          className="rounded-lg bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors flex items-center gap-1"
        >
          <CheckCircle2 size={12} />
          Approve
        </button>
        <button
          onClick={() => setRejectOpen(true)}
          className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1"
        >
          <XCircle size={12} />
          Reject
        </button>
      </div>

      <ApproveModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        requestId={requestId}
        title={title}
      />
      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        requestId={requestId}
        title={title}
      />
    </>
  );
}

function ApproveModal({
  open, onClose, requestId, title,
}: {
  open: boolean; onClose: () => void; requestId: string; title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function handleApprove() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/approvals/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to approve request");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Failed to approve request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Approve Request" description={`Approve: ${title}`} size="md"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleApprove} loading={loading}>
            {loading ? "Approving..." : "Approve"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">Are you sure you want to approve this request?</p>
          <p className="mt-1 text-xs text-zinc-500">{title}</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            <FileText className="mr-1 inline" size={12} />
            Approval Note (optional)
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Add a note for the record..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({
  open, onClose, requestId, title,
}: {
  open: boolean; onClose: () => void; requestId: string; title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function handleReject() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/approvals/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reject request");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Failed to reject request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Reject Request" description={`Reject: ${title}`} size="md"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="danger" onClick={handleReject} loading={loading}>
            {loading ? "Rejecting..." : "Reject"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-300">This will mark the request as <strong>rejected</strong>.</p>
          <p className="mt-1 text-xs text-zinc-500">{title}</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            <FileText className="mr-1 inline" size={12} />
            Rejection Reason
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Explain why the request was rejected..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}
