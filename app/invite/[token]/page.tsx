"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { API_ROUTES } from "@/lib/constants";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_ROUTES.TEAM_MEMBERS.VERIFY_INVITE}?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMember(data.member);
        } else {
          setError(data.error || "Invalid invite");
        }
      })
      .catch(() => setError("Failed to verify invite"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(API_ROUTES.TEAM_MEMBERS.SETUP_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to set password");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-zinc-500">Verifying invite...</p>
        </div>
      </div>
    );
  }

  if (error && !member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Invite Invalid</h1>
          <p className="mt-2 text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-zinc-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Account Activated</h1>
          <p className="mt-2 text-sm text-zinc-400">Your password has been set. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Set Your Password</h1>
            <p className="text-xs text-zinc-500">Complete your account setup</p>
          </div>
        </div>

        {member && (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
            <p className="text-sm text-zinc-300">
              Welcome, <span className="font-semibold text-white">{member.name}</span>
            </p>
            <p className="text-xs text-zinc-500">{member.email}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
                minLength={8}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-10 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={8}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-blue-500"
              />
            </div>
          </div>

          <PasswordStrengthMeter password={password} confirmPassword={confirmPassword} />

          <button
            type="submit"
            disabled={submitting || password !== confirmPassword || password.length < 8}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle size={16} />}
            Activate Account
          </button>
        </form>
      </div>
    </div>
  );
}
