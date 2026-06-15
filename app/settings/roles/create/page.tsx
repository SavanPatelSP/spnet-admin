"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateRolePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");

  const [riskLevel, setRiskLevel] =
    useState("Medium");

  const [protectedRole, setProtectedRole] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const permissionGroups = [
    {
      name: "Team Management",
      permissions: [
        "Add Team Members",
        "Remove Team Members",
        "Assign Roles",
        "Transfer Ownership",
      ],
    },
    {
      name: "Role Management",
      permissions: [
        "Create Roles",
        "Edit Roles",
        "Delete Roles",
        "Clone Roles",
        "Manage Permission Matrix",
      ],
    },
    {
      name: "Device Management",
      permissions: [
        "View Devices",
        "Revoke Devices",
        "View Activations",
        "Manage Device Policies",
      ],
    },
    {
      name: "Audit & Compliance",
      permissions: [
        "View Audit Logs",
        "Export Audit Logs",
        "Compliance Reporting",
      ],
    },
    {
      name: "Analytics",
      permissions: [
        "View Analytics",
        "View Revenue",
        "Export Reports",
      ],
    },
    {
      name: "System Administration",
      permissions: [
        "Manage Settings",
        "Maintenance Mode",
        "Backup Management",
      ],
    },
  ];

  async function createRole() {
    if (!name.trim()) {
      alert("Role name is required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/api/roles/create",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            riskLevel,
            protected: protectedRole,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to create role"
        );
      }

      router.push("/settings/roles");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-8">
        <h1 className="text-4xl font-black">
          Create Enterprise Role
        </h1>

        <p className="mt-3 text-zinc-400">
          Define role hierarchy,
          permissions, risk profile and
          operational authority.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="mb-6 text-xl font-semibold">
            Role Information
          </h2>

          <div className="space-y-5">
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Role Name"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
            />

            <textarea
              rows={4}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Role Description"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
            />

            <select
              value={riskLevel}
              onChange={(e) =>
                setRiskLevel(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
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

              <span>
                Protected Role
              </span>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
          <h2 className="mb-6 text-xl font-semibold">
            Role Summary
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 p-4">
              <p className="text-sm text-zinc-500">
                Risk Level
              </p>

              <p className="mt-1 font-medium">
                {riskLevel}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              <p className="text-sm text-zinc-500">
                Protection
              </p>

              <p className="mt-1 font-medium">
                {protectedRole
                  ? "Protected"
                  : "Standard"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              <p className="text-sm text-zinc-500">
                Status
              </p>

              <p className="mt-1 text-green-400">
                Ready
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <h2 className="mb-6 text-xl font-semibold">
          Permission Assignment
        </h2>

        <div className="grid gap-6 lg:grid-cols-2">
          {permissionGroups.map(
            (group) => (
              <div
                key={group.name}
                className="rounded-2xl border border-zinc-800 p-5"
              >
                <h3 className="mb-4 font-semibold">
                  {group.name}
                </h3>

                <div className="space-y-3">
                  {group.permissions.map(
                    (permission) => (
                      <label
                        key={permission}
                        className="flex items-center gap-3 rounded-xl border border-zinc-800 p-3"
                      >
                        <input type="checkbox" />

                        <span>
                          {permission}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            )
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() =>
              router.push(
                "/settings/roles"
              )
            }
            className="rounded-xl bg-zinc-800 px-5 py-3"
          >
            Cancel
          </button>

          <button
            onClick={createRole}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 text-white"
          >
            {loading
              ? "Creating..."
              : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
