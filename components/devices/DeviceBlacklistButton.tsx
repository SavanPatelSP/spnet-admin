"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { API_ROUTES } from "@/lib/constants";
import { Ban, CheckCircle } from "lucide-react";

interface Props {
  activationId: string;
  isBlacklisted: boolean;
  onToggle: () => void;
}

export function DeviceBlacklistButton({ activationId, isBlacklisted, onToggle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function handleBlacklist() {
    setActionLoading(true);
    try {
      const res = await fetch(API_ROUTES.DEVICES.BLACKLIST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationId }),
      });
      if (res.ok) {
        setOpen(false);
        onToggle();
        router.refresh();
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWhitelist() {
    setActionLoading(true);
    try {
      const res = await fetch(API_ROUTES.DEVICES.WHITELIST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationId }),
      });
      if (res.ok) {
        onToggle();
        router.refresh();
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (isBlacklisted) {
    return (
      <ActionButton onClick={handleWhitelist} variant="secondary" size="sm" loading={actionLoading}>
        <CheckCircle size={14} /> Whitelist
      </ActionButton>
    );
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="danger" size="sm">
        <Ban size={14} /> Blacklist
      </ActionButton>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleBlacklist}
        title="Blacklist Device"
        description="This device will be blocked from all activations. Are you sure?"
        confirmLabel="Blacklist Device"
        variant="danger"
        loading={actionLoading}
      />
    </>
  );
}
