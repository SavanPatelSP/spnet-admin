"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateLicenseModal() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [organization, setOrganization] = useState("");
  const [plan, setPlan] = useState("ENTERPRISE");
  const [maxDevices, setMaxDevices] = useState(10);
  const [status, setStatus] = useState("ACTIVE");
  const [expiresAt, setExpiresAt] = useState("2027-12-31");
  const [notes, setNotes] = useState("");

  async function createLicense() {
    if (!organization.trim()) {
      alert("Organization is required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/licenses/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organization,
            plan,
            maxDevices,
            status,
            expiresAt,
            notes,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to create license");
        return;
      }

      setOpen(false);

      setOrganization("");
      setPlan("ENTERPRISE");
      setMaxDevices(10);
      setStatus("ACTIVE");
      setExpiresAt("2027-12-31");
      setNotes("");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create license");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
      >
        Create License
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                Create License
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Configure the license before generating the key.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Organization Name"
                value={organization}
                onChange={(e) =>
                  setOrganization(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-800 p-3"
              />

              <select
                value={plan}
                onChange={(e) =>
                  setPlan(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-800 p-3"
              >
                <option value="FREE">FREE</option>
                <option value="BASIC">BASIC</option>
                <option value="PRO">PRO</option>
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
                    Number(e.target.value)
                  )
                }
                className="w-full rounded-xl bg-zinc-800 p-3"
              />

              <input
                type="date"
                value={expiresAt}
                onChange={(e) =>
                  setExpiresAt(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-800 p-3"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
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
                placeholder="Notes"
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                className="w-full rounded-xl bg-zinc-800 p-3"
                rows={4}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl bg-zinc-800 px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={createLicense}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-4 py-2 disabled:opacity-50"
              >
                {loading
                  ? "Creating..."
                  : "Create License"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
