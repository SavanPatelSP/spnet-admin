"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { PREMIUM_PLANS } from "@/lib/constants";

interface PremiumRequestActionsProps {
  requestId: string;
  licenseId: string;
  organization: string;
  requestedPlan: string;
  requestedDurationDays: number;
  reason: string | null;
  status: string;
  submittedBy: string | null;
  licenseKey: string;
  convertedSubscriptionId: string | null;
}

export default function PremiumRequestActions(data: PremiumRequestActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  if (data.status === "APPROVED" && data.convertedSubscriptionId) {
    return (
      <button
        onClick={() => router.push("/premium")}
        className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors"
      >
        View Grant
      </button>
    );
  }

  if (data.status === "APPROVED" || data.status === "REJECTED" || data.status === "EXPIRED") {
    return null;
  }

  return (
    <>
      <ActionMenu
        items={[
          { label: "Approve", onClick: () => setApproveOpen(true), variant: "primary" },
          { label: "Reject", onClick: () => setRejectOpen(true), variant: "danger" },
          { label: "Modify", onClick: () => setModifyOpen(true) },
          { label: "Convert to Premium", onClick: () => setConvertOpen(true) },
        ]}
      />
      <ApproveModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        requestId={data.requestId}
        organization={data.organization}
        plan={data.requestedPlan}
        durationDays={data.requestedDurationDays}
        licenseId={data.licenseId}
      />
      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        requestId={data.requestId}
        organization={data.organization}
      />
      <ModifyModal
        open={modifyOpen}
        onClose={() => setModifyOpen(false)}
        requestId={data.requestId}
        plan={data.requestedPlan}
        durationDays={data.requestedDurationDays}
        reason={data.reason}
      />
      <ConvertModal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        requestId={data.requestId}
        licenseId={data.licenseId}
        organization={data.organization}
        licenseKey={data.licenseKey}
        plan={data.requestedPlan}
        durationDays={data.requestedDurationDays}
        submittedBy={data.submittedBy}
      />
    </>
  );
}

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

function ApproveModal({
  open, onClose, requestId, organization, plan, durationDays, licenseId,
}: {
  open: boolean; onClose: () => void; requestId: string; organization: string;
  plan: string; durationDays: number; licenseId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalPlan, setFinalPlan] = useState(plan);
  const [finalDuration, setFinalDuration] = useState(durationDays);
  const [reviewNotes, setReviewNotes] = useState("");

  async function handleApprove() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/premium/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: finalPlan, durationDays: finalDuration }),
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
    <Modal open={open} onClose={onClose} title="Approve Request" description={`Approve premium request for ${organization}.`} size="md"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleApprove} disabled={loading}>
            {loading ? "Approving..." : "Approve & Grant"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-zinc-500">Organization</span><span className="text-zinc-200">{organization}</span>
            <span className="text-zinc-500">Requested Plan</span><span className="text-zinc-200">{plan}</span>
            <span className="text-zinc-500">Duration</span><span className="text-zinc-200">{durationDays} days</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Plan to Grant</label>
          <select value={finalPlan} onChange={(e) => setFinalPlan(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
          >
            {PREMIUM_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration (days)</label>
          <input type="number" min={1} value={finalDuration} onChange={(e) => setFinalDuration(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Review Notes (optional)</label>
          <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={2}
            placeholder="Notes for the review record..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({ open, onClose, requestId, organization }: {
  open: boolean; onClose: () => void; requestId: string; organization: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  async function handleReject() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/premium/requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes: reviewNotes || null }),
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
    <Modal open={open} onClose={onClose} title="Reject Request" description={`Reject premium request from ${organization}.`} size="md"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="danger" onClick={handleReject} disabled={loading}>
            {loading ? "Rejecting..." : "Reject Request"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
          This will mark the request as rejected. The submitter can be notified separately.
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Rejection Reason</label>
          <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3}
            placeholder="Explain why the request was rejected..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}

function ModifyModal({ open, onClose, requestId, plan, durationDays, reason }: {
  open: boolean; onClose: () => void; requestId: string;
  plan: string; durationDays: number; reason: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPlan, setNewPlan] = useState(plan);
  const [newDuration, setNewDuration] = useState(durationDays);
  const [newReason, setNewReason] = useState(reason || "");
  const [notes, setNotes] = useState("");

  async function handleModify() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/premium/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedPlan: newPlan,
          requestedDurationDays: newDuration,
          reason: newReason || null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to modify request");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Failed to modify request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Modify Request" description="Update the premium request details." size="md"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleModify} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Plan</label>
            <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            >
              {PREMIUM_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration (days)</label>
            <input type="number" min={1} value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Reason</label>
          <textarea value={newReason} onChange={(e) => setNewReason(e.target.value)} rows={2}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Internal Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Admin notes..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}

function ConvertModal({ open, onClose, requestId, licenseId, organization, licenseKey, plan, durationDays, submittedBy }: {
  open: boolean; onClose: () => void; requestId: string; licenseId: string;
  organization: string; licenseKey: string; plan: string; durationDays: number; submittedBy: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalPlan, setFinalPlan] = useState(plan);
  const [finalDuration, setFinalDuration] = useState(durationDays);
  const [subscriptionType, setSubscriptionType] = useState("CUSTOM");
  const [notes, setNotes] = useState("");

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + finalDuration);

  async function handleConvert() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/premium/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseId,
          plan: finalPlan,
          subscriptionType,
          durationDays: finalDuration,
          notes: `Converted from request ${requestId}. ${notes || ""}`.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to convert to premium");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Failed to convert to premium");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Convert to Premium" description="Grant premium directly from this request." size="md"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleConvert} disabled={loading}>
            {loading ? "Granting..." : "Convert & Grant"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-zinc-500">Organization</span><span className="text-zinc-200">{organization}</span>
            <span className="text-zinc-500">License</span><code className="text-zinc-200">{licenseKey}</code>
            <span className="text-zinc-500">Submitted By</span><span className="text-zinc-200">{submittedBy || "-"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Plan</label>
            <select value={finalPlan} onChange={(e) => setFinalPlan(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            >
              {PREMIUM_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Duration (days)</label>
            <input type="number" min={1} value={finalDuration} onChange={(e) => setFinalDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-300">
          <div className="font-medium">Grant Preview</div>
          <div className="mt-1 space-y-0.5">
            <div>Plan: <strong>{finalPlan}</strong> &middot; Type: <strong>{subscriptionType}</strong></div>
            <div>Start: <strong>{fmt(startDate)}</strong> &middot; End: <strong>{fmt(endDate)}</strong></div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Internal Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Additional context..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>
      </div>
    </Modal>
  );
}
