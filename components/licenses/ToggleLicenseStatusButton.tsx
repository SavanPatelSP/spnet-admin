"use client";

import { useRouter } from "next/navigation";

export default function ToggleLicenseStatusButton({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();

  async function toggle() {
    await fetch(
      "/api/licenses/toggle-status",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      }
    );

    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className={
        status === "ACTIVE"
          ? "rounded-xl bg-yellow-600 px-4 py-2"
          : "rounded-xl bg-green-600 px-4 py-2"
      }
    >
      {status === "ACTIVE"
        ? "Suspend License"
        : "Reactivate License"}
    </button>
  );
}
