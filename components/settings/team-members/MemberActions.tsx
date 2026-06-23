"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import {
  Ban,
  CheckCircle,
  Trash2,
  UserCog,
  ChevronDown,
  KeyRound,
  Unlock,
} from "lucide-react";
import dynamic from "next/dynamic";

const GeneratePasswordModal = dynamic(() => import("@/components/settings/team-members/GeneratePasswordModal"), { ssr: false });
const PasswordSuccessModal = dynamic(() => import("@/components/settings/team-members/PasswordSuccessModal"), { ssr: false });

interface Props {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberRole: string;
  status: string;
  currentUserRole?: string;
}

export default function MemberActions({ memberId, memberName, memberEmail, memberRole, status, currentUserRole }: Props) {
  const isOwner = currentUserRole === "OWNER";
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [savedPassword, setSavedPassword] = useState("");

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

  const handlePasswordSuccess = useCallback((password: string) => {
    setGenerateOpen(false);
    setSavedPassword(password);
    setSuccessOpen(true);
    router.refresh();
  }, [router]);

  const isActive = status === "ACTIVE";
  const canManageMembers = hasPermission("Remove Team Members");
  const canEditUsers = hasPermission("Edit Users");
  const canGeneratePassword = isOwner && hasPermission("Generate Passwords");
  const hasAnyAction = canManageMembers || canEditUsers || canGeneratePassword;
  if (!hasAnyAction) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(canGeneratePassword || canManageMembers) && (
        <div className="relative">
          <ActionButton onClick={() => setMenuOpen(!menuOpen)} variant="secondary" size="sm">
            <UserCog size={14} /> Actions <ChevronDown size={12} />
          </ActionButton>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
              {canGeneratePassword && (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); setGenerateOpen(true); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-700"
                  >
                    <KeyRound size={12} /> Generate Password
                  </button>
                  <div className="my-1 border-t border-zinc-700" />
                </>
              )}
              {canEditUsers && (isActive ? (
                <button
                  onClick={() => { setMenuOpen(false); suspendAccount(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-yellow-400 hover:bg-zinc-700"
                >
                  <Ban size={12} /> Suspend Account
                </button>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); activateAccount(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-emerald-400 hover:bg-zinc-700"
                >
                  <Unlock size={12} /> Activate Account
                </button>
              ))}
              {canManageMembers && (
                <button
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-zinc-700"
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {canManageMembers && (isActive ? (
        <ActionButton onClick={() => setStatusOpen(true)} variant="secondary" size="sm">
          <Ban size={14} /> Suspend
        </ActionButton>
      ) : (
        <ActionButton onClick={() => setStatusOpen(true)} variant="primary" size="sm">
          <CheckCircle size={14} /> Reactivate
        </ActionButton>
      ))}

      {canManageMembers && (
        <ActionButton onClick={() => setDeleteOpen(true)} variant="danger" size="sm">
          <Trash2 size={14} /> Delete
        </ActionButton>
      )}

      <ConfirmDialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={() => updateStatus(isActive ? "SUSPENDED" : "ACTIVE")}
        title={isActive ? "Suspend Team Member" : "Reactivate Team Member"}
        description={isActive ? "This will temporarily disable the member's access." : "This will restore the member's access."}
        confirmLabel={isActive ? "Suspend" : "Reactivate"}
        variant={isActive ? "danger" : "primary"}
        loading={statusLoading}
        error={error}
      />

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

      <GeneratePasswordModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        memberId={memberId}
        memberName={memberName}
        memberEmail={memberEmail}
        memberRole={memberRole}
        onSuccess={handlePasswordSuccess}
      />

      <PasswordSuccessModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        memberName={memberName}
        memberRole={memberRole}
        password={savedPassword}
      />
    </div>
  );

  async function suspendAccount() {
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.SUSPEND, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to suspend");
      showToast("Account suspended", "success");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Suspension failed", "error");
    }
  }

  async function activateAccount() {
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.ACTIVATE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to activate");
      showToast("Account activated", "success");
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Activation failed", "error");
    }
  }
}
