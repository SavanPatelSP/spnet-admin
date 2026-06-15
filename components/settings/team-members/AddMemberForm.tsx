"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";

type Role = { id: string; name: string };

export default function AddMemberForm() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API_ROUTES.ROLES.LIST)
      .then((res) => res.json())
      .then(setRoles)
      .catch(() => setError("Failed to load roles"));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const roleId = formData.get("roleId") as string;

    if (!name || !email || !roleId) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.TEAM_MEMBERS.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, roleId }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create member");
        return;
      }
      location.reload();
    } catch {
      setError("Failed to create member");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      <input
        name="name"
        placeholder="Full Name"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email Address"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
        required
      />
      <select
        name="roleId"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-zinc-100 outline-none focus:border-blue-500"
        required
      >
        <option value="">Select Role</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>{role.name}</option>
        ))}
      </select>
      <ActionButton onClick={() => {}} disabled={loading} variant="primary" size="lg">
        {loading ? "Creating..." : "Add Member"}
      </ActionButton>
    </form>
  );
}
