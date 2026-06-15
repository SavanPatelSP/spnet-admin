"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RoleSelector({
  memberId,
  currentRoleId,
  roles,
}: {
  memberId: string;
  currentRoleId: string;
  roles: {
    id: string;
    name: string;
  }[];
}) {
  const router = useRouter();

  const [roleId, setRoleId] =
    useState(currentRoleId);

  async function changeRole(
    value: string
  ) {
    setRoleId(value);

    await fetch(
      "/api/team-members/change-role",
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id: memberId,
          roleId: value,
        }),
      }
    );

    router.refresh();
  }

  return (
    <select
      value={roleId}
      onChange={(e) =>
        changeRole(e.target.value)
      }
      className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
    >
      {roles.map((role) => (
        <option
          key={role.id}
          value={role.id}
        >
          {role.name}
        </option>
      ))}
    </select>
  );
}
