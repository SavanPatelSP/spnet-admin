"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES, PERMISSION_GROUPS, RISK_LEVELS } from "@/lib/constants";

export default function CreateRolePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState("Medium");
  const [protectedRole, setProtectedRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createRole() {
    setError("");
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.ROLES.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, riskLevel, protected: protectedRole }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to create role");
        return;
      }
      router.push("/settings/roles");
      router.refresh();
    } catch {
      setError("Failed to create role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create Enterprise Role"
        description="Define role hierarchy, permissions, risk profile and operational authority."
        actions={
          <ActionButton variant="secondary" onClick={() => router.push("/settings/roles")}>
            Cancel
          </ActionButton>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8 lg:col-span-2">
          <h2 className="mb-6 text-xl font-bold">Role Information</h2>
          <div className="space-y-5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Role Name"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
            />
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Role Description"
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
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800 p-3">
              <input
                type="checkbox"
                checked={protectedRole}
                onChange={(e) => setProtectedRole(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Protected Role (cannot be deleted)</span>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="mb-6 text-xl font-bold">Role Summary</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <p className="text-sm text-zinc-500">Risk Level</p>
              <p className="mt-1 font-medium">{riskLevel}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <p className="text-sm text-zinc-500">Protection</p>
              <p className="mt-1 font-medium">{protectedRole ? "Protected" : "Standard"}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
              <p className="text-sm text-zinc-500">Status</p>
              <p className="mt-1 font-medium text-green-400">Ready</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <h2 className="mb-6 text-xl font-bold">Permission Assignment</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
            <div key={group} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5">
              <h3 className="mb-4 font-semibold">{group}</h3>
              <div className="space-y-3">
                {permissions.map((permission) => (
                  <label key={permission} className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:bg-zinc-800">
                    <input type="checkbox" className="h-4 w-4" />
                    <span className="text-sm">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <ActionButton variant="secondary" onClick={() => router.push("/settings/roles")}>
            Cancel
          </ActionButton>
          <ActionButton variant="primary" onClick={createRole} disabled={loading}>
            {loading ? "Creating..." : "Create Role"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
