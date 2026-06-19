"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { useState } from "react";
import { Trash2 } from "lucide-react";

interface Props {
  roleId: string;
}

export default function DeleteRoleButton({ roleId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function deleteRole() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_ROUTES.ROLES.DELETE, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roleId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete role");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="danger" size="sm">
        <Trash2 size={14} /> Delete
      </ActionButton>

      <ConfirmDialog
        open={open}
        onClose={() => { setOpen(false); setError(""); }}
        onConfirm={deleteRole}
        title="Delete Role"
        description="This will permanently delete this role. Members assigned to this role may lose permissions."
        confirmLabel="Delete Role"
        variant="danger"
        loading={loading}
        error={error}
      />
    </>
  );
}
