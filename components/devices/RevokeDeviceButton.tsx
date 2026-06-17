"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface Props {
  id: string;
}

export default function RevokeDeviceButton({ id }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleRevoke() {
    const response = await fetch(API_ROUTES.DEVICES.REVOKE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="danger" size="sm">
        <Trash2 size={14} /> Revoke
      </ActionButton>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleRevoke}
        title="Revoke Device"
        description="This will remove the device activation. The device will no longer be able to use this license."
        confirmLabel="Revoke Device"
        variant="danger"
      />
    </>
  );
}
