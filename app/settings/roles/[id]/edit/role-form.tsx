"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ALL_PERMISSIONS = [
  "View Users",
  "Suspend Users",
  "Delete Users",
  "Restore Users",
  "Manage User Access",
  "Add Team Members",
  "Remove Team Members",
  "Assign Roles",
  "Transfer Ownership",
  "Create Roles",
  "Edit Roles",
  "Delete Roles",
  "Manage Permission Matrix",
  "View Devices",
  "Revoke Devices",
  "View Activations",
  "View Audit Logs",
  "Export Audit Logs",
  "View Analytics",
  "View Revenue",
  "Export Reports",
  "Manage Settings",
  "Maintenance Mode",
  "Backup Management",
];

export default function EditRoleForm({
  role,
}: {
  role: any;
}) {
  const router = useRouter();

  const [name, setName] = useState(role.name);
  const [description, setDescription] =
    useState(role.description || "");

  const [riskLevel, setRiskLevel] =
    useState(role.riskLevel);

  const [protectedRole, setProtectedRole] =
    useState(role.protected);

  const [permissions, setPermissions] =
    useState(
      role.permissions.map(
        (p: any) => p.permission
      )
    );

  const [saving, setSaving] =
    useState(false);

  async function saveRole() {
    try {
      setSaving(true);

      const response = await fetch(
        "/api/roles/update",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: role.id,
            name,
            description,
            riskLevel,
            protected: protectedRole,
          }),
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      await fetch(
        "/api/roles/update-permissions",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            roleId: role.id,
            permissions,
          }),
        }
      );

      router.push(
        `/settings/roles/${role.id}`
      );

      router.refresh();
    } catch {
      alert("Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-black p-8">
        <h1 className="text-4xl font-black">
          Edit Role
        </h1>

        <p className="mt-3 text-zinc-400">
          Update role settings,
          permissions and governance.
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="grid gap-6">
          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
          />

          <textarea
            rows={5}
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
          />

          <select
            value={riskLevel}
            onChange={(e) =>
              setRiskLevel(
                e.target.value
              )
            }
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={protectedRole}
              onChange={(e) =>
                setProtectedRole(
                  e.target.checked
                )
              }
            />
            Protected Role
          </label>

          <div>
            <h2 className="mb-4 text-xl font-semibold">
              Permission Assignment
            </h2>

            <div className="grid gap-3 md:grid-cols-2">
              {ALL_PERMISSIONS.map(
                (permission) => (
                  <label
                    key={permission}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(
                        permission
                      )}
                      onChange={(e) => {
                        if (
                          e.target.checked
                        ) {
                          setPermissions([
                            ...permissions,
                            permission,
                          ]);
                        } else {
                          setPermissions(
                            permissions.filter(
                              (p) =>
                                p !==
                                permission
                            )
                          );
                        }
                      }}
                    />

                    {permission}
                  </label>
                )
              )}
            </div>
          </div>

          <button
            onClick={saveRole}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-3 text-white"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
