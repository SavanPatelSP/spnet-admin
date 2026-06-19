"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { Modal } from "@/components/ui/Modal";
import { API_ROUTES } from "@/lib/constants";
import { UserPlus, Mail, Users, CheckCircle, XCircle, X, Plus, ArrowRight, AlertTriangle } from "lucide-react";

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

type InviteMethod = "rows" | "csv";

let rowCounter = 0;

function createRow(roleId = ""): InviteRow {
  return { id: `row-${++rowCounter}`, name: "", email: "", roleId };
}

function parseCsv(text: string): { name: string; email: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) return { name: parts[0], email: parts[1] };
      return { name: "", email: parts[0] ?? "" };
    });
}

export function BulkInviteModal({ roles, open, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<InviteMethod>("rows");
  const [rows, setRows] = useState<InviteRow[]>([createRow()]);
  const [csvText, setCsvText] = useState("");
  const [defaultRoleId, setDefaultRoleId] = useState(roles[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedCsv = useMemo(() => (method === "csv" ? parseCsv(csvText) : []), [method, csvText]);
  const csvErrors = useMemo(() => {
    const errs: string[] = [];
    if (method === "csv" && csvText.trim()) {
      parsedCsv.forEach((entry, i) => {
        if (!entry.email || !entry.email.includes("@")) errs.push(`Row ${i + 1}: invalid email`);
      });
    }
    return errs;
  }, [method, csvText, parsedCsv]);

  const totalInvites = method === "rows" ? rows.filter((r) => r.email.trim()).length : parsedCsv.length;
  const canSubmit = totalInvites > 0 && (method === "rows" ? rows.every((r) => !r.email.trim() || r.email.includes("@")) : csvErrors.length === 0);

  function addRow() {
    setRows((prev) => [...prev, createRow(defaultRoleId)]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: string, field: keyof InviteRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function resetState() {
    setStep(1);
    setRows([createRow()]);
    setCsvText("");
    setResults(null);
    setError(null);
    setMethod("rows");
  }

  function handleClose() {
    if (!loading) {
      resetState();
      onClose();
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      let payload: { name: string; email: string; roleId: string }[];
      if (method === "rows") {
        payload = rows.filter((r) => r.email.trim()).map((r) => ({ name: r.name, email: r.email, roleId: r.roleId || defaultRoleId }));
      } else {
        payload = parsedCsv.map((entry) => ({ name: entry.name, email: entry.email, roleId: defaultRoleId }));
      }
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

  if (results) {
    return (
      <Modal open={open} onClose={handleClose} title="Bulk Invite Users" size="lg">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">Invitation Results</h3>
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
                <span className="flex-1 text-sm text-zinc-200">{result.email}</span>
                {!result.success && result.error && (
                  <span className="text-sm text-red-400">{result.error}</span>
                )}
                {result.success && (
                  <span className="text-sm text-green-400">Invited</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <ActionButton onClick={handleClose} variant="primary" size="sm">
              Done
            </ActionButton>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Invite Users" size="lg" description="Invite multiple users to your team.">
      <div className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">1</span>
              <h4 className="text-sm font-semibold">Invite Method</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMethod("rows")}
                className={`flex flex-col items-center gap-3 rounded-xl border p-5 transition-colors ${
                  method === "rows"
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <Users size={24} className={method === "rows" ? "text-blue-400" : "text-zinc-400"} />
                <span className={`text-sm font-medium ${method === "rows" ? "text-blue-400" : "text-zinc-300"}`}>Individual Rows</span>
                <span className="text-xs text-zinc-500 text-center">Add users one by one with name, email, and role</span>
              </button>
              <button
                onClick={() => setMethod("csv")}
                className={`flex flex-col items-center gap-3 rounded-xl border p-5 transition-colors ${
                  method === "csv"
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <Mail size={24} className={method === "csv" ? "text-blue-400" : "text-zinc-400"} />
                <span className={`text-sm font-medium ${method === "csv" ? "text-blue-400" : "text-zinc-300"}`}>CSV Paste</span>
                <span className="text-xs text-zinc-500 text-center">Paste comma-separated name,email rows</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">2</span>
              <h4 className="text-sm font-semibold">Recipients</h4>
            </div>

            {method === "rows" ? (
              <>
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <table className="w-full">
                    <thead className="border-b border-zinc-800 bg-zinc-950/40">
                      <tr>
                        <th className="p-3 text-left text-xs font-medium text-zinc-400">Name</th>
                        <th className="p-3 text-left text-xs font-medium text-zinc-400">Email</th>
                        <th className="w-12 p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-zinc-800">
                          <td className="p-2">
                            <input
                              value={row.name}
                              onChange={(e) => updateRow(row.id, "name", e.target.value)}
                              placeholder="Full name"
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={row.email}
                              onChange={(e) => updateRow(row.id, "email", e.target.value)}
                              placeholder="Email address"
                              type="email"
                              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="p-2">
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
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  Paste rows as <span className="font-mono text-zinc-400">Name,email@example.com</span>, one per line.
                </p>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                  placeholder={"John,john@example.com\nJane,jane@example.com"}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500 resize-none font-mono"
                />
                {csvText.trim() && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                    <p className="text-xs text-zinc-500">Parsed: <span className="text-zinc-200">{parsedCsv.length}</span> recipient(s)</p>
                    {csvErrors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {csvErrors.map((err, i) => (
                          <p key={i} className="text-xs text-red-400">{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">3</span>
              <h4 className="text-sm font-semibold">Role & Configuration</h4>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Default Role</label>
              <select
                value={defaultRoleId}
                onChange={(e) => setDefaultRoleId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-zinc-500">
                {method === "rows" ? "Individual rows can override this role." : "This role will be applied to all CSV recipients."}
              </p>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold">4</span>
                <h4 className="text-sm font-semibold">Review Summary</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <span className="text-sm text-zinc-400">Invite Method</span>
                  <span className="flex items-center gap-2 text-sm text-zinc-200">
                    {method === "rows" ? <Users size={14} /> : <Mail size={14} />}
                    {method === "rows" ? "Individual Rows" : "CSV Paste"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <span className="text-sm text-zinc-400">Total Recipients</span>
                  <span className="flex items-center gap-2 text-sm text-zinc-200">
                    <UserPlus size={14} />
                    {totalInvites}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <span className="text-sm text-zinc-400">Default Role</span>
                  <span className="text-sm text-zinc-200">{roles.find((r) => r.id === defaultRoleId)?.name ?? "N/A"}</span>
                </div>
              </div>
              {!canSubmit && (
                <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-400" />
                  <p className="text-sm text-yellow-400">
                    No valid recipients found. Please add at least one valid email address.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Audit Preview</span>
              </div>
              <pre className="font-mono text-xs text-zinc-400">
{JSON.stringify({ action: "BULK_INVITE", method, count: totalInvites, defaultRole: roles.find((r) => r.id === defaultRoleId)?.name ?? "N/A" }, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {[1, 2, 3, 4].map((s) => (
              <span key={s} className={`flex items-center gap-1 ${step === s ? "text-blue-400" : ""}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  step === s ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
                }`}>{s}</span>
                {s < 4 && <ArrowRight size={12} />}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            {step > 1 ? (
              <ActionButton variant="secondary" onClick={() => setStep(step - 1)} disabled={loading}>
                Back
              </ActionButton>
            ) : (
              <ActionButton variant="secondary" onClick={handleClose} disabled={loading}>
                Cancel
              </ActionButton>
            )}
            {step < 4 ? (
              <ActionButton
                onClick={() => setStep(step + 1)}
                disabled={(step === 2 && method === "rows" && rows.filter((r) => r.email.trim()).length === 0) || loading}
              >
                Next
              </ActionButton>
            ) : (
              <ActionButton onClick={handleSubmit} loading={loading} disabled={!canSubmit}>
                <UserPlus size={14} /> Send Invitations
              </ActionButton>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
