"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActionButton } from "@/components/ui/ActionButton";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES } from "@/lib/constants";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface Props {
  id: string;
  size?: "sm" | "md";
}

export default function DeleteLicenseButton({ id, size = "sm" }: Props) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [open, setOpen] = useState(false);

  if (!hasPermission("Delete Licenses") && !open) return null;

  async function handleDelete() {
    const response = await fetch(API_ROUTES.LICENSES.DELETE, {
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
      <ActionButton onClick={() => setOpen(true)} variant="ghost" size={size}>
        <Trash2 size={14} className="text-red-400" />
      </ActionButton>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete License"
        description="This action cannot be undone. The license and all associated activations will be permanently deleted."
        confirmLabel="Delete License"
        variant="danger"
      />
    </>
  );
}
