"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, ALL_PERMISSIONS, RISK_LEVELS } from "@/lib/constants";
import type { RoleWithPermissions } from "@/types/common";

interface Props {
  role: RoleWithPermissions;
}

export default function EditRoleForm({ role }: Props) {
  const router = useRouter();
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [riskLevel, setRiskLevel] = useState(role.riskLevel);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role.permissions.map((p: { permission: string }) => p.permission))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function togglePermission(p: string) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function saveRole() {
    setError("");
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(API_ROUTES.ROLES.UPDATE, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: role.id, name, description, riskLevel }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update role");
        return;
      }

      await fetch(API_ROUTES.ROLES.UPDATE_PERMISSIONS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: role.id, permissions: [...selectedPermissions] }),
      });

      router.push(`/settings/roles/${role.id}`);
      router.refresh();
    } catch {
      setError("Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-xl font-bold">Role Information</h2>
        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Role Name"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          />
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
          >
            {RISK_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Permissions</h2>
          <span className="text-sm text-zinc-500">{selectedPermissions.size} of {ALL_PERMISSIONS.length} selected</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {ALL_PERMISSIONS.map((permission) => (
            <label
              key={permission}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                selectedPermissions.has(permission)
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPermissions.has(permission)}
                onChange={() => togglePermission(permission)}
                className="h-4 w-4"
              />
              <span className="text-sm">{permission}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <ActionButton variant="secondary" onClick={() => router.push(`/settings/roles/${role.id}`)}>
          Cancel
        </ActionButton>
        <ActionButton variant="primary" onClick={saveRole} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </ActionButton>
      </div>
    </div>
  );
}
