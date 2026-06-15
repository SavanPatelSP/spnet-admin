"use client";

import { useRouter } from "next/navigation";

export default function MemberActions({
  memberId,
  status,
}: {
  memberId: string;
  status: string;
}) {
  const router = useRouter();

  async function updateStatus(
    newStatus: string
  ) {
    await fetch(
      "/api/team-members/update-status",
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id: memberId,
          status: newStatus,
        }),
      }
    );

    router.refresh();
  }

  async function deleteMember() {
    if (
      !confirm(
        "Delete this team member?"
      )
    ) {
      return;
    }

    await fetch(
      "/api/team-members/delete",
      {
        method: "DELETE",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id: memberId,
        }),
      }
    );

    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "ACTIVE" ? (
        <button
          onClick={() =>
            updateStatus(
              "SUSPENDED"
            )
          }
          className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
        >
          Suspend
        </button>
      ) : (
        <button
          onClick={() =>
            updateStatus("ACTIVE")
          }
          className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white"
        >
          Reactivate
        </button>
      )}

      <button
        onClick={deleteMember}
        className="rounded-lg bg-red-900 px-3 py-2 text-sm text-white"
      >
        Delete
      </button>
    </div>
  );
}
