"use client";

import { useRouter } from "next/navigation";

export default function GenerateLicenseButton() {
  const router = useRouter();

  async function generate() {
    await fetch("/api/licenses/create", {
      method: "POST",
    });

    router.refresh();
  }

  return (
    <button
      onClick={generate}
      className="
        rounded-xl
        bg-blue-600
        px-5
        py-3
        font-semibold
        hover:bg-blue-500
      "
    >
      Generate License
    </button>
  );
}
