"use client";

import { useRouter } from "next/navigation";

export default function RegenerateLicenseButton({
  id,
}: {
  id: string;
}) {
  const router = useRouter();

  async function regenerate() {
    const confirmed =
      confirm(
        "Generate a new license key?"
      );

    if (!confirmed) return;

    await fetch(
      "/api/licenses/regenerate-key",
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
      onClick={regenerate}
      className="rounded-xl bg-blue-600 px-4 py-2"
    >
      Regenerate Key
    </button>
  );
}
