"use client";

import { useState, useCallback, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/shared";
import {
  RefreshCw, Eye, EyeOff, Copy, Check, Shield,
  AlertTriangle, TrendingUp, Clock, FileText, Zap,
  Hash, Target, Flame,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberRole: string;
  onSuccess: (password: string) => void;
}

const PASSWORD_LENGTHS = [12, 16, 20, 24] as const;

export default function GeneratePasswordModal({
  open, onClose, memberId, memberName, memberEmail, memberRole, onSuccess,
}: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [length, setLength] = useState<number>(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasAnyType = uppercase || lowercase || numbers || symbols;

  const charsetSize = useMemo(() => {
    let size = 0;
    if (uppercase) size += 26;
    if (lowercase) size += 26;
    if (numbers) size += 10;
    if (symbols) size += 30;
    return size || 62;
  }, [uppercase, lowercase, numbers, symbols]);

  const entropy = useMemo(() => {
    if (!generatedPassword) return 0;
    return Math.round(length * Math.log2(charsetSize) * 10) / 10;
  }, [length, charsetSize, generatedPassword]);

  const crackTimeLabel = useMemo(() => {
    if (entropy < 28) return { label: "Instant", color: "text-red-400" };
    if (entropy < 36) return { label: "Minutes", color: "text-red-400" };
    if (entropy < 44) return { label: "Hours", color: "text-orange-400" };
    if (entropy < 52) return { label: "Days", color: "text-yellow-400" };
    if (entropy < 60) return { label: "Months", color: "text-green-400" };
    if (entropy < 68) return { label: "Years", color: "text-emerald-400" };
    if (entropy < 80) return { label: "Centuries", color: "text-emerald-400" };
    return { label: "Eons", color: "text-emerald-400" };
  }, [entropy]);

  const strength = useMemo(() => {
    if (entropy >= 80) return { label: "Very Strong", color: "text-emerald-400", bar: "bg-emerald-500", width: "100%" };
    if (entropy >= 60) return { label: "Strong", color: "text-green-400", bar: "bg-green-500", width: "75%" };
    if (entropy >= 40) return { label: "Fair", color: "text-yellow-400", bar: "bg-yellow-500", width: "50%" };
    return { label: "Weak", color: "text-red-400", bar: "bg-red-500", width: "25%" };
  }, [entropy]);

  const generate = useCallback(() => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const sym = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let chars = "";
    if (uppercase) chars += upper;
    if (lowercase) chars += lower;
    if (numbers) chars += digits;
    if (symbols) chars += sym;
    if (!chars) chars = upper + lower + digits;

    let pw = "";
    if (uppercase) pw += upper[Math.floor(Math.random() * upper.length)];
    if (lowercase) pw += lower[Math.floor(Math.random() * lower.length)];
    if (numbers) pw += digits[Math.floor(Math.random() * digits.length)];
    if (symbols) pw += sym[Math.floor(Math.random() * sym.length)];

    const all = chars;
    for (let i = pw.length; i < length; i++) {
      pw += all[Math.floor(Math.random() * all.length)];
    }

    setGeneratedPassword(pw.split("").sort(() => Math.random() - 0.5).join(""));
    setCopied(false);
  }, [length, uppercase, lowercase, numbers, symbols]);

  async function handleSave() {
    if (!generatedPassword) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.GENERATE_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, length, uppercase, lowercase, numbers, symbols }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to save password");
        return;
      }
      onSuccess(generatedPassword);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      showToast("Password copied to clipboard", "success");
    } catch {
      showToast("Failed to copy", "error");
    }
  }

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Password"
      description="Create a secure password for this team member."
      size="lg"
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={handleSave}
            disabled={saving || !generatedPassword}
          >
            {saving ? "Saving..." : "Save Password"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Team Member Info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">1</span>
            <h4 className="text-sm font-semibold text-zinc-100">Team Member</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="text-zinc-500">Name</div>
            <div className="font-medium text-zinc-100">{memberName}</div>
            <div className="text-zinc-500">Role</div>
            <div>
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-200">{memberRole}</span>
            </div>
            <div className="text-zinc-500">Email</div>
            <div className="text-zinc-100">{memberEmail}</div>
          </div>
        </div>

        {/* Security Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">2</span>
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
              <Shield size={14} />
              Security Configuration
            </h4>
          </div>

          {/* Password Length */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Password Length</label>
            <div className="flex gap-2">
              {PASSWORD_LENGTHS.map((len) => (
                <button
                  key={len}
                  onClick={() => setLength(len)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                    length === len
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {/* Character Options */}
          <div className="space-y-2">
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Character Options</label>
            {[
              { label: "Uppercase (A-Z)", key: "upper", value: uppercase, set: setUppercase },
              { label: "Lowercase (a-z)", key: "lower", value: lowercase, set: setLowercase },
              { label: "Numbers (0-9)", key: "num", value: numbers, set: setNumbers },
              { label: "Symbols (!@#$%...)", key: "sym", value: symbols, set: setSymbols },
            ].map((opt) => (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 transition-colors hover:border-zinc-700"
              >
                <input
                  type="checkbox"
                  checked={opt.value}
                  onChange={(e) => opt.set(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-zinc-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Password Preview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">3</span>
            <h4 className="text-sm font-semibold text-zinc-100">Generated Password</h4>
          </div>

          {/* Strength Indicator */}
          {generatedPassword && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500">Strength</span>
                <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className={`h-full rounded-full transition-all ${strength.bar}`} style={{ width: strength.width }} />
              </div>
            </div>
          )}

          {generatedPassword ? (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-3">
              <input
                readOnly
                type={showPassword ? "text" : "password"}
                value={generatedPassword}
                className="flex-1 bg-transparent text-sm font-mono text-zinc-100 outline-none"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-lg bg-zinc-700 p-2 text-zinc-400 hover:bg-zinc-600"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={handleCopy}
                className="rounded-lg bg-blue-500/10 p-2 text-blue-400 hover:bg-blue-500/20"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-700 p-6">
              <p className="text-sm text-zinc-500">Click {'\u201C'}Generate New Password{'\u201D'} to create a password</p>
            </div>
          )}

          {/* Entropy & Crack Time */}
          {generatedPassword && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Hash size={11} className="text-zinc-500" />
                  <span className="text-[10px] font-medium text-zinc-500">Entropy</span>
                </div>
                <p className="text-sm font-bold text-zinc-200">{entropy} <span className="text-[10px] font-normal text-zinc-500">bits</span></p>
                <p className="text-[10px] text-zinc-600">Charset: {charsetSize} characters</p>
              </div>
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap size={11} className="text-zinc-500" />
                  <span className="text-[10px] font-medium text-zinc-500">Crack Time (bcrypt)</span>
                </div>
                <p className={`text-sm font-bold ${crackTimeLabel.color}`}>{crackTimeLabel.label}</p>
                <p className="text-[10px] text-zinc-600">{length} chars &times; {charsetSize} charset</p>
              </div>
            </div>
          )}
        </div>

        {/* Audit Preview */}
        {generatedPassword && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">4</span>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-yellow-300">
                <FileText size={14} />
                Audit Preview
              </h4>
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex">
                <span className="w-32 shrink-0 text-zinc-500">Action</span>
                <span className="text-yellow-400">GENERATED_TEAM_MEMBER_PASSWORD</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 text-zinc-500">Target</span>
                <span className="text-zinc-300">{memberName} ({memberEmail})</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 text-zinc-500">Severity</span>
                <span className="text-red-400">High</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 text-zinc-500">Password Length</span>
                <span className="text-zinc-300">{length} characters</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 text-zinc-500">Entropy</span>
                <span className="text-zinc-300">{entropy} bits</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 text-zinc-500">Crack Time</span>
                <span className={crackTimeLabel.color}>{crackTimeLabel.label}</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 text-zinc-500">Cost Impact</span>
                <span className="text-zinc-300">No direct charge</span>
              </div>
            </div>
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-yellow-500/10 bg-yellow-500/5 p-2.5">
              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-yellow-400" />
              <p className="text-[10px] leading-relaxed text-yellow-200/70">
                This action will be logged in the audit trail. The member will be notified and must use the new credentials on next login. Previous sessions will remain active.
              </p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center">
          <ActionButton
            variant="primary"
            onClick={generate}
            disabled={!hasAnyType}
          >
            <RefreshCw size={14} />
            Generate New Password
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
}
