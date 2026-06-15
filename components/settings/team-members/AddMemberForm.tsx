"use client";

import { useEffect, useState } from "react";

type Role = {
  id: string;
  name: string;
};

export default function AddMemberForm() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    fetch("/api/roles/list")
      .then((res) => res.json())
      .then(setRoles)
      .catch(console.error);
  }, []);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    const formData = new FormData(
      e.currentTarget
    );

    const response = await fetch(
      "/api/team-members/create",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          roleId: formData.get("roleId"),
        }),
      }
    );

    if (!response.ok) {
      alert("Failed to create member");
      setLoading(false);
      return;
    }

    location.reload();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <input
        name="name"
        placeholder="Full Name"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
        required
      />

      <input
        name="email"
        type="email"
        placeholder="Email Address"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
        required
      />

      <select
        name="roleId"
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
        required
      >
        <option value="">
          Select Role
        </option>

        {roles.map((role) => (
          <option
            key={role.id}
            value={role.id}
          >
            {role.name}
          </option>
        ))}
      </select>

      <button
        disabled={loading}
        className="rounded-xl bg-blue-600 px-4 py-3 text-white"
      >
        {loading
          ? "Creating..."
          : "Add Member"}
      </button>
    </form>
  );
}
