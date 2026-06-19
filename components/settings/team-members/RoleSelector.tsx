"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { API_ROUTES } from "@/lib/constants";

interface Props {
  memberId: string;
  currentRoleId: string;
  roles: { id: string; name: string }[];
}

export default function RoleSelector({ memberId, currentRoleId, roles }: Props) {
  const router = useRouter();
  const [roleId, setRoleId] = useState(currentRoleId);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedRoleName = roles.find((r) => r.id === pendingRoleId)?.name || "";
  const currentRoleName = roles.find((r) => r.id === currentRoleId)?.name || "";

  async function confirmChange() {
    if (!pendingRoleId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.CHANGE_ROLE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memberId, roleId: pendingRoleId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to change role");
        return;
      }
      setRoleId(pendingRoleId);
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(value: string) {
    if (value === currentRoleId) return;
    setPendingRoleId(value);
    setConfirmOpen(true);
  }

  return (
    <>
      <select
        value={roleId}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-200 outline-none"
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>{role.name}</option>
        ))}
      </select>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingRoleId(null); }}
        onConfirm={confirmChange}
        title="Change Role"
        description={`Change role from "${currentRoleName}" to "${selectedRoleName}"? This will modify the member's permissions immediately.`}
        confirmLabel="Change Role"
        variant="primary"
        loading={loading}
        error={error}
      />
    </>
  );
}
