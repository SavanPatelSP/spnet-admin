"use client";

import { useRouter } from "next/navigation";

export default function PolicyActions({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) {
  const router = useRouter();

  async function toggle() {
    await fetch(
      "/api/security/toggle-policy",
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id,
          enabled: !enabled,
        }),
      }
    );

    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className={`rounded-lg px-4 py-2 text-sm ${
        enabled
          ? "bg-red-600 text-white"
          : "bg-green-600 text-white"
      }`}
    >
      {enabled
        ? "Disable"
        : "Enable"}
    </button>
  );
}
