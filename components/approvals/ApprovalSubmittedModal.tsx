"use client";

import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { Clock, CheckCircle2, User, FileText, Hash, Target } from "lucide-react";

interface ApprovalSubmittedData {
  requestId: string;
  message: string;
  status: string;
}

interface ApprovalSubmittedModalProps {
  open: boolean;
  onClose: () => void;
  data: ApprovalSubmittedData | null;
  workflowType?: string;
  target?: string;
}

const workflowLabels: Record<string, string> = {
  LICENSE_CREATE: "Create License",
  LICENSE_BULK: "Bulk Create License",
  LICENSE_TRANSFER: "Transfer License",
  REGENERATE_KEY: "Regenerate License Key",
  PREMIUM_GRANT: "Grant Premium",
  PREMIUM_EXTEND: "Extend Premium",
  PREMIUM_CHANGE_PLAN: "Change Premium Plan",
  PREMIUM_DOWNGRADE: "Downgrade Premium",
  PREMIUM_CONVERT_LIFETIME: "Convert to Lifetime",
  PREMIUM_CONVERT_CUSTOM: "Convert to Custom",
  COINS_GRANT: "Grant Coins",
  COINS_REMOVE: "Remove Coins",
  COINS_SET: "Set Coins",
  GEMS_GRANT: "Grant Gems",
  GEMS_REVOKE: "Revoke Gems",
  GEMS_SET: "Set Gems",
  TEAM_CREATE: "Create Team Member",
  TEAM_UPDATE: "Update Team Member",
  TEAM_CHANGE_ROLE: "Change Role",
  TRANSFER_OWNERSHIP: "Transfer Ownership",
};

export default function ApprovalSubmittedModal({ open, onClose, data, workflowType, target }: ApprovalSubmittedModalProps) {
  if (!data) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Approval Request Submitted"
      description="Your request has been sent for review."
      size="md"
      footer={
        <ActionButton variant="primary" onClick={onClose}>
          Done
        </ActionButton>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <p className="text-sm font-medium text-emerald-300">{data.message || "Approval request submitted"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <Hash size={10} />
              Request ID
            </div>
            <p className="mt-0.5 font-mono text-xs text-zinc-200">{data.requestId.slice(0, 12)}...</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <FileText size={10} />
              Request Type
            </div>
            <p className="mt-0.5 text-sm font-medium text-zinc-200">
              {workflowType ? (workflowLabels[workflowType] || workflowType) : "-"}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <Clock size={10} />
              Status
            </div>
            <p className="mt-0.5">
              <span className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
                {data.status || "PENDING"}
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <Clock size={10} />
              Submitted
            </div>
            <p className="mt-0.5 text-sm text-zinc-200">{new Date().toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <Target size={10} />
              Target
            </div>
            <p className="mt-0.5 text-sm text-zinc-200">{target || "-"}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <User size={10} />
              Requested By
            </div>
            <p className="mt-0.5 text-sm text-zinc-200">You</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
