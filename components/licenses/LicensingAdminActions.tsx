"use client";

import { useRouter } from "next/navigation";

export default function LicensingAdminActions() {
  const router = useRouter();

  async function emergencySuspend() {
    if (
      !confirm(
        "Suspend ALL active licenses?"
      )
    ) {
      return;
    }

    await fetch(
      "/api/licenses/emergency-mode",
      {
        method: "POST",
      }
    );

    router.refresh();
  }

  function exportReport() {
    window.print();
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={exportReport}
        className="rounded-xl bg-blue-600 px-4 py-3 text-white"
      >
        Export License Report
      </button>

      <button
        onClick={() =>
          alert(
            "Review expiring licenses from License Management page."
          )
        }
        className="rounded-xl bg-yellow-600 px-4 py-3 text-white"
      >
        Review Expiring Licenses
      </button>

      <button
        onClick={emergencySuspend}
        className="rounded-xl bg-red-600 px-4 py-3 text-white"
      >
        Emergency Suspend All
      </button>
    </div>
  );
}
