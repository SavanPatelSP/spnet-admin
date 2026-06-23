"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActionButton } from "@/components/ui/ActionButton";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES } from "@/lib/constants";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  id: string;
  size?: "sm" | "md";
}

export default function RegenerateLicenseButton({ id, size = "sm" }: Props) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [open, setOpen] = useState(false);

  if (!hasPermission("Regenerate License Keys") && !open) return null;

  async function handleRegenerate() {
    const response = await fetch(API_ROUTES.LICENSES.REGENERATE_KEY, {
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
        <RefreshCw size={14} className="text-blue-400" />
      </ActionButton>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleRegenerate}
        title="Regenerate License Key"
        description="This will generate a new license key. The old key will stop working. Active devices may need to be re-activated."
        confirmLabel="Regenerate Key"
        variant="primary"
      />
    </>
  );
}
