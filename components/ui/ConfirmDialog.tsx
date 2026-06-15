"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { ActionButton } from "./ActionButton";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", variant = "danger" }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <ActionButton variant="secondary" onClick={onClose}>
          Cancel
        </ActionButton>
        <ActionButton variant={variant} onClick={onConfirm}>
          {confirmLabel}
        </ActionButton>
      </div>
    </Modal>
  );
}
