"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import {
  Ban,
  CheckCircle,
  Trash2,
  Mail,
  RefreshCw,
  KeyRound,
  Lock,
  Unlock,
  UserCog,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

interface Props {
  memberId: string;
  status: string;
  currentUserRole?: string;
}

export default function MemberActions({ memberId, status, currentUserRole }: Props) {
  const canManagePasswords = currentUserRole === "OWNER" || currentUserRole === "SUPER_ADMIN";
  const router = useRouter();
  const { showToast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [tempPasswordModalOpen, setTempPasswordModalOpen] = useState(false);
  const [tempPasswordLoading, setTempPasswordLoading] = useState(false);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  const [showTempPassword, setShowTempPassword] = useState(false);

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

  async function sendInvite(resend = false) {
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.INVITE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, resend }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send invite");
      showToast(resend ? "Invite resent" : "Invite sent", "success");
      if (data.inviteLink) {
        setGeneratedLink(data.inviteLink);
        setLinkModalOpen(true);
      }
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Invite failed", "error");
    }
  }

  async function generatePasswordLink() {
    setLinkLoading(true);
    setGeneratedLink(null);
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.GENERATE_PASSWORD_LINK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to generate link");
      setGeneratedLink(data.link);
      setLinkModalOpen(true);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Link generation failed", "error");
    } finally {
      setLinkLoading(false);
    }
  }

  async function generateTempPassword() {
    setTempPasswordLoading(true);
    setGeneratedTempPassword(null);
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.TEMP_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to generate password");
      setGeneratedTempPassword(data.tempPassword);
      setTempPasswordModalOpen(true);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Password generation failed", "error");
    } finally {
      setTempPasswordLoading(false);
    }
  }

  async function resetPassword() {
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.RESET_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to reset password");
      setGeneratedTempPassword(data.tempPassword);
      setTempPasswordModalOpen(true);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Reset failed", "error");
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard", "success"));
  }

  const isActive = status === "ACTIVE";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <ActionButton onClick={() => setMenuOpen(!menuOpen)} variant="secondary" size="sm">
          <UserCog size={14} /> Actions <ChevronDown size={12} />
        </ActionButton>
        {menuOpen && (
          <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-zinc-700 bg-zinc-800 py-1 shadow-xl">
            {canManagePasswords && (
              <>
                <button
                  onClick={() => { setMenuOpen(false); generatePasswordLink(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-700"
                >
                  <KeyRound size={12} /> Generate Password Link
                </button>
                <button
                  onClick={() => { setMenuOpen(false); resetPassword(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-700"
                >
                  <Lock size={12} /> Reset Password
                </button>
                <button
                  onClick={() => { setMenuOpen(false); generateTempPassword(); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-700"
                >
                  <KeyRound size={12} /> Generate Temp Password
                </button>
                <div className="my-1 border-t border-zinc-700" />
              </>
            )}
            {isActive ? (
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
            )}
            <button
              onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-zinc-700"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      {isActive ? (
        <ActionButton onClick={() => setStatusOpen(true)} variant="secondary" size="sm">
          <Ban size={14} /> Suspend
        </ActionButton>
      ) : (
        <ActionButton onClick={() => setStatusOpen(true)} variant="primary" size="sm">
          <CheckCircle size={14} /> Reactivate
        </ActionButton>
      )}

      <ActionButton onClick={() => setDeleteOpen(true)} variant="danger" size="sm">
        <Trash2 size={14} /> Delete
      </ActionButton>

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

      <Modal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Password Setup Link"
        description="Share this secure link with the team member. It expires in 24 hours."
        size="md"
        footer={
          <ActionButton onClick={() => setLinkModalOpen(false)} variant="secondary">
            Close
          </ActionButton>
        }
      >
        <div className="space-y-3">
          {generatedLink ? (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-3">
              <input
                readOnly
                value={generatedLink}
                className="flex-1 bg-transparent text-xs text-zinc-300 outline-none"
              />
              <button
                onClick={() => copyToClipboard(generatedLink)}
                className="rounded-lg bg-blue-500/10 p-2 text-blue-400 hover:bg-blue-500/20"
              >
                <Copy size={14} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">{linkLoading ? "Generating link..." : "No link generated."}</p>
          )}
        </div>
      </Modal>

      <Modal
        open={tempPasswordModalOpen}
        onClose={() => setTempPasswordModalOpen(false)}
        title="Temporary Password"
        description="Share this temporary password securely. The user will be prompted to change it on first login."
        size="md"
        footer={
          <ActionButton onClick={() => setTempPasswordModalOpen(false)} variant="secondary">
            Close
          </ActionButton>
        }
      >
        <div className="space-y-3">
          {generatedTempPassword ? (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-3">
              <input
                readOnly
                type={showTempPassword ? "text" : "password"}
                value={generatedTempPassword}
                className="flex-1 bg-transparent text-xs text-zinc-300 outline-none"
              />
              <button
                onClick={() => setShowTempPassword(!showTempPassword)}
                className="rounded-lg bg-zinc-700 p-2 text-zinc-400 hover:bg-zinc-600"
              >
                {showTempPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => copyToClipboard(generatedTempPassword)}
                className="rounded-lg bg-blue-500/10 p-2 text-blue-400 hover:bg-blue-500/20"
              >
                <Copy size={14} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">{tempPasswordLoading ? "Generating..." : "No password generated."}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
