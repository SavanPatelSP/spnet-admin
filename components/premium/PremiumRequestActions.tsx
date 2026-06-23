"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { usePermission } from "@/hooks/usePermissions";
import { PREMIUM_PLANS } from "@/lib/constants";
import { XCircle, Edit3, FileText, Shield, Calendar, Eye } from "lucide-react";

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

function fmt(d: Date) {
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  return `${dd} ${mm} ${date.getFullYear()}`;
}

export default function PremiumRequestActions(data: PremiumRequestActionsProps) {
  const router = useRouter();
  const { hasPermission } = usePermission();
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

  const items = [
    ...(hasPermission("Manage Premium Requests") ? [{ label: "Approve" as const, onClick: () => setApproveOpen(true), variant: "primary" as const }] : []),
    ...(hasPermission("Manage Premium Requests") ? [{ label: "Reject" as const, onClick: () => setRejectOpen(true), variant: "danger" as const }] : []),
    ...(hasPermission("Manage Premium Requests") ? [{ label: "Modify" as const, onClick: () => setModifyOpen(true) }] : []),
    ...(hasPermission("Grant Premium") ? [{ label: "Convert to Premium" as const, onClick: () => setConvertOpen(true) }] : []),
  ];

  if (items.length === 0) return null;

  return (
    <>
      <ActionMenu items={items} />
      <ApproveModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        requestId={data.requestId}
        organization={data.organization}
        plan={data.requestedPlan}
        durationDays={data.requestedDurationDays}
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

function ApproveModal({
  open, onClose, requestId, organization, plan, durationDays,
}: {
  open: boolean; onClose: () => void; requestId: string; organization: string;
  plan: string; durationDays: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalPlan, setFinalPlan] = useState(plan);
  const [finalDuration, setFinalDuration] = useState(durationDays);
  const [reviewNotes, setReviewNotes] = useState("");

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + finalDuration);

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
    <Modal open={open} onClose={onClose} title="Approve Request" description={`Approve premium request for ${organization}.`} size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleApprove} loading={loading}>
            {loading ? "Approving..." : "Approve & Grant"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Step 1: Request Details */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">Request Details</h4>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-zinc-500">Organization</div>
            <div className="font-medium text-zinc-200">{organization}</div>
            <div className="text-zinc-500">Requested Plan</div>
            <div><span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-200">{plan}</span></div>
            <div className="text-zinc-500">Duration</div>
            <div className="text-zinc-200">{durationDays} days</div>
          </div>
        </div>

        {/* Step 2: Grant Configuration */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
            <h4 className="text-sm font-semibold text-zinc-100">Grant Configuration</h4>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Shield className="mr-1 inline" size={12} />
                  Plan to Grant
                </label>
                <select value={finalPlan} onChange={(e) => setFinalPlan(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  {PREMIUM_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Calendar className="mr-1 inline" size={12} />
                  Duration (days)
                </label>
                <input type="number" min={1} value={finalDuration} onChange={(e) => setFinalDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <FileText className="mr-1 inline" size={12} />
                Review Notes (optional)
              </label>
              <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={2}
                placeholder="Notes for the review record..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Impact Summary & Audit */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
              <Eye size={14} />
              Impact &amp; Audit
            </h4>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="mb-2 text-xs font-medium text-zinc-500">Grant Preview</div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Plan</span>
                  <span className="font-medium text-zinc-200">{finalPlan}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Start</span>
                  <span className="text-zinc-300">{fmt(startDate)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">End</span>
                  <span className="text-zinc-300">{fmt(endDate)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
              <span className="text-xs text-zinc-500">Duration</span>
              <p className="font-medium text-zinc-200">{finalDuration} days</p>
              <span className="mt-2 block text-xs text-zinc-500">Organization</span>
              <p className="font-medium text-zinc-200">{organization}</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex">
                <span className="w-28 text-zinc-500">Action</span>
                <span className="text-yellow-400">PREMIUM_REQUEST_APPROVED</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Request</span>
                <span className="text-zinc-300">{requestId}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Plan</span>
                <span className="text-zinc-300">{finalPlan}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Duration</span>
                <span className="text-zinc-300">{finalDuration} days</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Start</span>
                <span className="text-zinc-300">{fmt(startDate)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">End</span>
                <span className="text-zinc-300">{fmt(endDate)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Notes</span>
                <span className="text-zinc-300">{reviewNotes || <span className="text-zinc-600">(none)</span>}</span>
              </div>
            </div>
          </div>
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
    <Modal open={open} onClose={onClose} title="Reject Request" description={`Reject premium request from ${organization}.`} size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="danger" onClick={handleReject} loading={loading}>
            {loading ? "Rejecting..." : "Reject Request"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Step 1: Confirmation Context */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">Request Context</h4>
          </div>
          <div className="rounded-lg bg-zinc-800/30 px-3 py-2 text-sm">
            <span className="text-zinc-500">Organization: </span>
            <span className="font-medium text-zinc-200">{organization}</span>
          </div>
        </div>

        {/* Step 2: Warning */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-xs font-bold text-red-200">2</span>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-red-200">
              <XCircle size={14} />
              Rejection Warning
            </h4>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-xs text-red-300">
              This will mark the request as <strong>rejected</strong>. The submitter can be notified separately. This action is logged.
            </p>
          </div>
        </div>

        {/* Step 3: Reason */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
            <h4 className="text-sm font-semibold text-zinc-100">Rejection Reason</h4>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              <FileText className="mr-1 inline" size={12} />
              Reason
            </label>
            <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3}
              placeholder="Explain why the request was rejected..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex">
                <span className="w-28 text-zinc-500">Action</span>
                <span className="text-yellow-400">PREMIUM_REQUEST_REJECTED</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Request</span>
                <span className="text-zinc-300">{requestId}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Organization</span>
                <span className="text-zinc-300">{organization}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Reason</span>
                <span className="text-zinc-300">{reviewNotes || <span className="text-zinc-600">(not provided)</span>}</span>
              </div>
            </div>
          </div>
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

  const hasChanges = newPlan !== plan || newDuration !== durationDays || newReason !== (reason || "");

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
    <Modal open={open} onClose={onClose} title="Modify Request" description="Update the premium request details." size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleModify} loading={loading} disabled={!hasChanges}>
            {loading ? "Saving..." : "Save Changes"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Step 1: Current Values */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">Current Values</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-xs text-zinc-500">Plan</span>
              <p className="font-medium text-zinc-200">{plan}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
              <span className="text-xs text-zinc-500">Duration</span>
              <p className="font-medium text-zinc-200">{durationDays} days</p>
            </div>
          </div>
        </div>

        {/* Step 2: Edit Fields */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
              <Edit3 size={14} />
              Edit Fields
            </h4>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Shield className="mr-1 inline" size={12} />
                  Plan
                </label>
                <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                >
                  {PREMIUM_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Calendar className="mr-1 inline" size={12} />
                  Duration (days)
                </label>
                <input type="number" min={1} value={newDuration} onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <FileText className="mr-1 inline" size={12} />
                Reason
              </label>
              <textarea value={newReason} onChange={(e) => setNewReason(e.target.value)} rows={2}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Internal Notes
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Admin notes..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Changes & Audit */}
        {hasChanges && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <Eye size={14} />
                Changes &amp; Audit
              </h4>
            </div>

            <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex">
                  <span className="w-28 text-zinc-500">Action</span>
                  <span className="text-yellow-400">PREMIUM_REQUEST_MODIFIED</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Request</span>
                  <span className="text-zinc-300">{requestId}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Plan</span>
                  <span className="text-zinc-300">{newPlan}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Duration</span>
                  <span className="text-zinc-300">{newDuration} days</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Reason</span>
                  <span className="text-zinc-300">{newReason || <span className="text-zinc-600">(not set)</span>}</span>
                </div>
                <div className="flex">
                  <span className="w-28 text-zinc-500">Notes</span>
                  <span className="text-zinc-300">{notes || <span className="text-zinc-600">(none)</span>}</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
  const [subscriptionType] = useState("CUSTOM");
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
    <Modal open={open} onClose={onClose} title="Convert to Premium" description="Grant premium directly from this request." size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>Cancel</ActionButton>
          <ActionButton variant="primary" onClick={handleConvert} loading={loading}>
            {loading ? "Granting..." : "Convert & Grant"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* Step 1: Request Source */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">Request Source</h4>
          </div>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="text-zinc-500">Organization</div>
            <div className="font-medium text-zinc-200">{organization}</div>
            <div className="text-zinc-500">License</div>
            <code className="text-zinc-300">{licenseKey}</code>
            <div className="text-zinc-500">Submitted By</div>
            <div className="text-zinc-200">{submittedBy || <span className="text-zinc-600">-</span>}</div>
            <div className="text-zinc-500">Requested Plan</div>
            <div><span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-200">{plan}</span></div>
          </div>
        </div>

        {/* Step 2: Grant Configuration */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
            <h4 className="text-sm font-semibold text-zinc-100">Grant Configuration</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <Shield className="mr-1 inline" size={12} />
                Plan
              </label>
              <select value={finalPlan} onChange={(e) => setFinalPlan(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              >
                {PREMIUM_PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                <Calendar className="mr-1 inline" size={12} />
                Duration (days)
              </label>
              <input type="number" min={1} value={finalDuration} onChange={(e) => setFinalDuration(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              <FileText className="mr-1 inline" size={12} />
              Internal Notes
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Additional context..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Step 3: Grant Preview & Audit */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
              <Eye size={14} />
              Grant Preview &amp; Audit
            </h4>
          </div>

          <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="text-xs font-medium text-blue-400 mb-2">Grant Preview</div>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <div className="text-zinc-500">Plan</div>
              <div className="text-zinc-200 font-medium">{finalPlan}</div>
              <div className="text-zinc-500">Type</div>
              <div className="text-zinc-200">{subscriptionType}</div>
              <div className="text-zinc-500">Start</div>
              <div className="text-zinc-200">{fmt(startDate)}</div>
              <div className="text-zinc-500">End</div>
              <div className="text-zinc-200">{fmt(endDate)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audit Preview</h4>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <div className="flex">
                <span className="w-28 text-zinc-500">Action</span>
                <span className="text-yellow-400">PREMIUM_GRANTED_FROM_REQUEST</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Request</span>
                <span className="text-zinc-300">{requestId}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">License</span>
                <span className="text-zinc-300">{licenseKey}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Plan</span>
                <span className="text-zinc-300">{finalPlan}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Type</span>
                <span className="text-zinc-300">{subscriptionType}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Duration</span>
                <span className="text-zinc-300">{finalDuration} days</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Start</span>
                <span className="text-zinc-300">{fmt(startDate)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">End</span>
                <span className="text-zinc-300">{fmt(endDate)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-zinc-500">Notes</span>
                <span className="text-zinc-300">{notes || <span className="text-zinc-600">(none)</span>}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
