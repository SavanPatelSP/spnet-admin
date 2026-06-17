"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { Modal } from "@/components/ui/Modal";
import { API_ROUTES } from "@/lib/constants";
import { UserPlus, X, Plus, CheckCircle, XCircle } from "lucide-react";

interface InviteRow {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

interface InviteResult {
  email: string;
  success: boolean;
  error?: string;
}

interface Props {
  roles: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
}

let rowCounter = 0;

function createRow(roleId = ""): InviteRow {
  return { id: `row-${++rowCounter}`, name: "", email: "", roleId };
}

export function BulkInviteModal({ roles, open, onClose }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<InviteRow[]>([createRow()]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addRow() {
    setRows((prev) => [...prev, createRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: string, field: keyof InviteRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const payload = rows.map((r) => ({ name: r.name, email: r.email, roleId: r.roleId }));
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.BULK_INVITE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invites: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send invites");
        return;
      }
      setResults(data.results ?? data.invites ?? []);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setRows([createRow()]);
      setResults(null);
      setError(null);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Invite Users" size="xl">
      {results ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-300">Invitation Results</h3>
          <div className="space-y-2">
            {results.map((result, i) => (
              <div
                key={result.email || i}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  result.success
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                {result.success ? (
                  <CheckCircle size={18} className="text-green-400" />
                ) : (
                  <XCircle size={18} className="text-red-400" />
                )}
                <span className="flex-1 text-sm">{result.email}</span>
                {!result.success && result.error && (
                  <span className="text-sm text-red-400">{result.error}</span>
                )}
                {result.success && (
                  <span className="text-sm text-green-400">Invited</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <ActionButton onClick={handleClose} variant="primary" size="sm">
              Done
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Add users below to send bulk invitations.
          </p>
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full">
              <thead className="border-b border-zinc-800 bg-zinc-950/40">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-zinc-400">Name</th>
                  <th className="p-3 text-left text-sm font-medium text-zinc-400">Email</th>
                  <th className="p-3 text-left text-sm font-medium text-zinc-400">Role</th>
                  <th className="w-12 p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-800">
                    <td className="p-3">
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(row.id, "name", e.target.value)}
                        placeholder="Full name"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        value={row.email}
                        onChange={(e) => updateRow(row.id, "email", e.target.value)}
                        placeholder="Email address"
                        type="email"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={row.roleId}
                        onChange={(e) => updateRow(row.id, "roleId", e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-blue-500"
                      >
                        <option value="">Select role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                        className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-30"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addRow}
            className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
          >
            <Plus size={16} /> Add Row
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <ActionButton variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </ActionButton>
            <ActionButton onClick={handleSubmit} loading={loading}>
              <UserPlus size={14} /> Send Invitations
            </ActionButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
