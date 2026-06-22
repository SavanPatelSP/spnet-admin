"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { useToast } from "@/components/ui/Toast";
import { Copy, Check, Eye, EyeOff, CheckCircle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  memberName: string;
  memberRole: string;
  password: string;
}

export default function PasswordSuccessModal({
  open, onClose, memberName, memberRole, password,
}: Props) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      showToast("Password copied to clipboard", "success");
    } catch {
      showToast("Failed to copy", "error");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Password Updated Successfully"
      description="The team member's password has been updated."
      size="md"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Close
          </ActionButton>
          <ActionButton variant="primary" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy Password"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
        </div>

        {/* Member Info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Team Member</span>
              <span className="font-medium text-zinc-100">{memberName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Role</span>
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-200">{memberRole}</span>
            </div>
            <div className="border-t border-zinc-800 pt-3">
              <span className="mb-2 block text-xs font-medium text-zinc-500">New Password</span>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-3">
                <input
                  readOnly
                  type={showPassword ? "text" : "password"}
                  value={password}
                  className="flex-1 bg-transparent text-sm font-mono text-zinc-100 outline-none"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="rounded-lg bg-zinc-700 p-2 text-zinc-400 hover:bg-zinc-600"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
          <p className="text-xs text-yellow-300">
            Please copy this password now. For security reasons, you will not be able to view it again after closing this window.
          </p>
        </div>
      </div>
    </Modal>
  );
}
