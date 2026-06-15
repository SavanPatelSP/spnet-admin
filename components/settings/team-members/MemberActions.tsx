"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { API_ROUTES } from "@/lib/constants";
import { useState } from "react";
import { Ban, CheckCircle, Trash2 } from "lucide-react";

interface Props {
  memberId: string;
  status: string;
}

export default function MemberActions({ memberId, status }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function updateStatus(newStatus: string) {
    await fetch(API_ROUTES.TEAM_MEMBERS.UPDATE_STATUS, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: memberId, status: newStatus }),
    });
    router.refresh();
  }

  async function deleteMember() {
    await fetch(API_ROUTES.TEAM_MEMBERS.DELETE, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: memberId }),
    });
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "ACTIVE" ? (
        <ActionButton onClick={() => updateStatus("SUSPENDED")} variant="secondary" size="sm">
          <Ban size={14} /> Suspend
        </ActionButton>
      ) : (
        <ActionButton onClick={() => updateStatus("ACTIVE")} variant="primary" size="sm">
          <CheckCircle size={14} /> Reactivate
        </ActionButton>
      )}

      <ActionButton onClick={() => setDeleteOpen(true)} variant="danger" size="sm">
        <Trash2 size={14} /> Delete
      </ActionButton>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteMember}
        title="Delete Team Member"
        description="This will permanently remove this team member and their access."
        confirmLabel="Delete Member"
        variant="danger"
      />
    </div>
  );
}
