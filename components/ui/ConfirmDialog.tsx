"use client";

import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { ActionButton } from "./ActionButton";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "danger" | "primary" | "secondary";
  customContent?: ReactNode;
  loading?: boolean;
  error?: string;
  hideCancel?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = "Confirm", variant = "danger",
  customContent, loading, error, hideCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      {customContent ? (
        <div className="py-2">
          <h3 className="mb-4 text-xl font-bold">{title}</h3>
          {customContent}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
          {description && <p className="mt-2 text-sm text-zinc-400">{description}</p>}
        </div>
      )}
      {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
      {!hideCancel && (
        <div className="mt-6 flex justify-center gap-3">
          <ActionButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </ActionButton>
          <ActionButton variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </ActionButton>
        </div>
      )}
    </Modal>
  );
}
