"use client";

import { useRouter } from "next/navigation";

export default function DeleteRoleButton({
  roleId,
}: {
  roleId: string;
}) {
  const router = useRouter();

  async function deleteRole() {
    const confirmed = confirm(
      "Delete this role?"
    );

    if (!confirmed) return;

    const response = await fetch(
      "/api/roles/delete",
      {
        method: "DELETE",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id: roleId,
        }),
      }
    );

    if (!response.ok) {
      alert("Failed to delete role");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={deleteRole}
      className="rounded-xl bg-red-600 px-4 py-2 text-white"
    >
      Delete
    </button>
  );
}
