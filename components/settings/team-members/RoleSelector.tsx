"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_ROUTES } from "@/lib/constants";

interface Props {
  memberId: string;
  currentRoleId: string;
  roles: { id: string; name: string }[];
}

export default function RoleSelector({ memberId, currentRoleId, roles }: Props) {
  const router = useRouter();
  const [roleId, setRoleId] = useState(currentRoleId);

  async function changeRole(value: string) {
    setRoleId(value);
    await fetch(API_ROUTES.TEAM_MEMBERS.CHANGE_ROLE, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: memberId, roleId: value }),
    });
    router.refresh();
  }

  return (
    <select
      value={roleId}
      onChange={(e) => changeRole(e.target.value)}
      className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-200 outline-none"
    >
      {roles.map((role) => (
        <option key={role.id} value={role.id}>{role.name}</option>
      ))}
    </select>
  );
}
