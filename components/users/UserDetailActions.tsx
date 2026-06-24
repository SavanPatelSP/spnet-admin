"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES } from "@/lib/constants";
import { Ban, CheckCircle, KeyRound, Trash2 } from "lucide-react";
interface MemberWithRole {
  id: string;
  name: string;
  email: string;
  status: string;
  mfaEnabled: boolean;
  lockedUntil: Date | null;
  failedLoginAttempts: number;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role: { name: string; riskLevel: string; _count: { permissions: number } };
  license: { id: string; key: string; organization: string; plan: string } | null;
}

interface Props {
  member: MemberWithRole;
}

export function UserDetailActions({ member }: Props) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    await fetch(API_ROUTES.TEAM_MEMBERS.UPDATE_STATUS, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, status: newStatus }),
    });
    router.refresh();
  }

  async function deleteMember() {
    await fetch(API_ROUTES.TEAM_MEMBERS.DELETE, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id }),
    });
    setDeleteOpen(false);
    router.push("/users");
  }

  async function resetPassword() {
    setResetLoading(true);
    setResetError(null);
    setTempPassword(null);
    try {
      const res = await fetch("/api/team-members/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "Failed to reset password");
      } else {
        setTempPassword(data.tempPassword);
      }
    } catch {
      setResetError("Network error");
    } finally {
      setResetLoading(false);
    }
  }

  function copyPassword() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
    }
  }

  const canEdit = hasPermission("Edit Users");
  const canResetPassword = hasPermission("Reset Passwords");
  const canDelete = hasPermission("Delete Users");
  if (!canEdit && !canResetPassword && !canDelete) return null;

  return (
    <div className="flex items-center gap-2">
      {canEdit && (member.status === "ACTIVE" ? (
        <ActionButton onClick={() => updateStatus("SUSPENDED")} variant="secondary" size="sm">
          <Ban size={14} /> Suspend
        </ActionButton>
      ) : (
        <ActionButton onClick={() => updateStatus("ACTIVE")} variant="primary" size="sm">
          <CheckCircle size={14} /> Reactivate
        </ActionButton>
      ))}

      {canResetPassword && (
        <ActionButton onClick={() => setResetOpen(true)} variant="secondary" size="sm">
          <KeyRound size={14} /> Reset Password
        </ActionButton>
      )}

      {canDelete && (
        <ActionButton onClick={() => setDeleteOpen(true)} variant="danger" size="sm">
          <Trash2 size={14} /> Delete
        </ActionButton>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteMember}
        title="Delete Team Member"
        description="This will permanently remove this team member and their access."
        confirmLabel="Delete Member"
        variant="danger"
      />

      <ConfirmDialog
        open={resetOpen}
        onClose={() => { setResetOpen(false); setTempPassword(null); setResetError(null); }}
        onConfirm={resetPassword}
        title="Reset Password"
        description={
          tempPassword
            ? undefined
            : `This will generate a new temporary password for ${member.name}. They will need to change it on next login.`
        }
        confirmLabel={tempPassword ? "Close" : "Generate New Password"}
        variant={tempPassword ? "primary" : "primary"}
        hideCancel={!!tempPassword}
        customContent={
          tempPassword ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                New temporary password for <span className="font-medium text-zinc-200">{member.name}</span>:
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-3">
                <code className="flex-1 font-mono text-sm text-green-400 select-all">{tempPassword}</code>
                <button
                  onClick={copyPassword}
                  className="rounded-lg bg-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-yellow-500">Share this password securely with the user.</p>
            </div>
          ) : undefined
        }
        loading={resetLoading}
        error={resetError || undefined}
      />
    </div>
  );
}
