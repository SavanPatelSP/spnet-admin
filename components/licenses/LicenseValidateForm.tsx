"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { CheckCircle, XCircle } from "lucide-react";

interface ValidationResult {
  valid: boolean;
  license?: {
    id: string;
    organization: string;
    plan: string;
    status: string;
    expiresAt: string;
    maxDevices: number;
  };
  message?: string;
}

export default function LicenseValidateForm() {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState("");

  async function validate() {
    setError("");
    setResult(null);
    if (!key.trim()) { setError("License key is required"); return; }
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.LICENSES.VALIDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult({ valid: false, message: data.error || "Validation failed" });
        return;
      }
      setResult(data);
    } catch {
      setError("Validation request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-4 font-semibold">Validate License Key</h3>

      <div className="flex gap-3">
        <input value={key} onChange={(e) => setKey(e.target.value)}
          placeholder="Enter license key (e.g. SPNET-...)"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-100 outline-none focus:border-blue-500"
          onKeyDown={(e) => { if (e.key === "Enter") validate(); }} />
        <ActionButton onClick={validate} variant="primary" loading={loading}>
          Validate
        </ActionButton>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {result && (
        <div className={`mt-4 rounded-xl border p-4 ${result.valid ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10"}`}>
          <div className="mb-2 flex items-center gap-2">
            {result.valid ? (
              <CheckCircle size={18} className="text-green-400" />
            ) : (
              <XCircle size={18} className="text-red-400" />
            )}
            <span className={`font-semibold ${result.valid ? "text-green-400" : "text-red-400"}`}>
              {result.valid ? "Valid License" : "Invalid License"}
            </span>
          </div>
          {result.message && <p className="text-sm text-zinc-400">{result.message}</p>}
          {result.license && (
            <div className="mt-2 space-y-1 text-sm text-zinc-400">
              <p><span className="text-zinc-500">Organization:</span> {result.license.organization}</p>
              <p><span className="text-zinc-500">Plan:</span> {result.license.plan}</p>
              <p><span className="text-zinc-500">Status:</span> {result.license.status}</p>
              <p><span className="text-zinc-500">Expires:</span> {new Date(result.license.expiresAt).toLocaleDateString()}</p>
              <p><span className="text-zinc-500">Max Devices:</span> {result.license.maxDevices}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
