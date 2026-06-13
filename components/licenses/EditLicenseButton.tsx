"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditLicenseButton({
  license,
}: {
  license: any;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [organization, setOrganization] = useState(
    license.organization
  );

  const [plan, setPlan] = useState(
    license.plan
  );

  const [status, setStatus] = useState(
    license.status
  );

  const [maxDevices, setMaxDevices] = useState(
    license.maxDevices
  );

  const [notes, setNotes] = useState(
    license.notes ?? ""
  );

  const [expiresAt, setExpiresAt] = useState(
    new Date(license.expiresAt)
      .toISOString()
      .split("T")[0]
  );

  async function save() {
    try {
      setLoading(true);

      console.log(
        "Saving expiry:",
        expiresAt
      );

console.log("Saving license", {
  organization,
  expiresAt,
});
      
const response = await fetch(
        "/api/licenses/update",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: license.id,
            organization,
            plan,
            status,
            maxDevices,
            expiresAt,
            notes,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.error ??
            "Failed to update license"
        );
        return;
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to update license"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-6 text-2xl font-bold">
              Edit License
            </h2>

            <div className="space-y-4">
              <input
                value={organization}
                onChange={(e) =>
                  setOrganization(
                    e.target.value
                  )
                }
                placeholder="Organization"
                className="w-full rounded-xl bg-zinc-800 p-3"
              />

              <select
                value={plan}
                onChange={(e) =>
                  setPlan(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-zinc-800 p-3"
              >
                <option value="FREE">
                  FREE
                </option>
                <option value="BASIC">
                  BASIC
                </option>
                <option value="PRO">
                  PRO
                </option>
                <option value="BUSINESS">
                  BUSINESS
                </option>
                <option value="ENTERPRISE">
                  ENTERPRISE
                </option>
                <option value="LIFETIME">
                  LIFETIME
                </option>
              </select>

              <input
                type="number"
                min="1"
                value={maxDevices}
                onChange={(e) =>
                  setMaxDevices(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full rounded-xl bg-zinc-800 p-3"
              />

              <input
                type="date"
                value={expiresAt}
                onChange={(e) =>
                  setExpiresAt(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-zinc-800 p-3"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
                className="w-full rounded-xl bg-zinc-800 p-3"
              >
                <option value="ACTIVE">
                  ACTIVE
                </option>
                <option value="SUSPENDED">
                  SUSPENDED
                </option>
                <option value="PENDING">
                  PENDING
                </option>
                <option value="EXPIRED">
                  EXPIRED
                </option>
                <option value="REVOKED">
                  REVOKED
                </option>
              </select>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                rows={4}
                className="w-full rounded-xl bg-zinc-800 p-3"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() =>
                  setOpen(false)
                }
                className="rounded-xl bg-zinc-800 px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={save}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-4 py-2 disabled:opacity-50"
              >
                {loading
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
