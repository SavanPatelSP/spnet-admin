"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RevokeDeviceButton({
  id,
}: {
  id: string;
}) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  async function revoke() {
    const confirmed =
      window.confirm(
        "Revoke this device?"
      );

    if (!confirmed) return;

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/devices/revoke",
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

      if (!response.ok) {
        throw new Error(
          "Failed to revoke device"
        );
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to revoke device"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={revoke}
      disabled={loading}
      className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
    >
      {loading
        ? "Revoking..."
        : "Revoke"}
    </button>
  );
}
