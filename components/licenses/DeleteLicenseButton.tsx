"use client";

import { useRouter } from "next/navigation";

export default function DeleteLicenseButton({
  id,
}: {
  id: string;
}) {
  const router = useRouter();

  async function remove() {
    const confirmed = window.confirm(
      "Delete this license?"
    );

    if (!confirmed) return;

    await fetch("/api/licenses/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
      }),
    });

    router.refresh();
  }

  return (
    <button
      onClick={remove}
      className="
        rounded-lg
        bg-red-900/30
        px-3
        py-1
        text-sm
        text-red-400
        hover:bg-red-900/50
      "
    >
      Delete
    </button>
  );
}
