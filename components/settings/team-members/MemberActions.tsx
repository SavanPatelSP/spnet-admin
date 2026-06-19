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
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(newStatus: string) {
    setStatusLoading(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.UPDATE_STATUS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update status");
        return;
      }
      setStatusOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setStatusLoading(false);
    }
  }

  async function deleteMember() {
    setDeleteLoading(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.DELETE, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete member");
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "ACTIVE" ? (
        <>
          <ActionButton onClick={() => setStatusOpen(true)} variant="secondary" size="sm">
            <Ban size={14} /> Suspend
          </ActionButton>
          <ConfirmDialog
            open={statusOpen}
            onClose={() => setStatusOpen(false)}
            onConfirm={() => updateStatus("SUSPENDED")}
            title="Suspend Team Member"
            description="This will temporarily disable the member's access. They can be reactivated later."
            confirmLabel="Suspend"
            variant="danger"
            loading={statusLoading}
            error={error}
          />
        </>
      ) : (
        <>
          <ActionButton onClick={() => setStatusOpen(true)} variant="primary" size="sm">
            <CheckCircle size={14} /> Reactivate
          </ActionButton>
          <ConfirmDialog
            open={statusOpen}
            onClose={() => setStatusOpen(false)}
            onConfirm={() => updateStatus("ACTIVE")}
            title="Reactivate Team Member"
            description="This will restore the member's access."
            confirmLabel="Reactivate"
            variant="primary"
            loading={statusLoading}
            error={error}
          />
        </>
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
        loading={deleteLoading}
        error={error}
      />
    </div>
  );
}
