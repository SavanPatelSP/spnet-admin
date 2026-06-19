"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  KeyRound, Eye, EyeOff, AlertCircle, Shield, CheckCircle,
  Lock, Server, Activity, Fingerprint, Clock,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const SECURITY_FEATURES = [
  { icon: Shield, label: "Protected Access", desc: "Role-based access control with granular permissions" },
  { icon: Lock, label: "Session Security", desc: "Encrypted sessions with automatic expiration" },
  { icon: Fingerprint, label: "Device Verification", desc: "Trust scoring and device fingerprinting" },
  { icon: Activity, label: "Audit Logging", desc: "Complete audit trail of all administrative actions" },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (urlError) {
      setError(
        urlError === "CredentialsSignin"
          ? "Invalid credentials. Check your email, password, and license key."
          : "Authentication failed. Please try again."
      );
    }
  }, [urlError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn("credentials", { email, password, licenseKey, callbackUrl });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 lg:flex-row">
      {/* ── Left Panel: Branding + Security ── */}
      <div className="relative flex w-full flex-col justify-between overflow-hidden p-8 lg:w-[42%] lg:p-12 xl:p-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/[0.07] via-transparent to-purple-500/[0.05]" />
        <div className="pointer-events-none absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">{APP_NAME}</h1>
              <p className="text-[11px] font-semibold tracking-[0.15em] text-zinc-500 uppercase">Admin Panel</p>
            </div>
          </div>

          <div className="mt-10 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Enterprise Administration
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Centralized platform for managing licenses, devices, users, and security across your entire infrastructure.
            </p>
          </div>

          <div className="mt-12 space-y-3">
            {SECURITY_FEATURES.map((feat) => (
              <div
                key={feat.label}
                className="group flex items-start gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-3.5 transition-all duration-200 hover:border-zinc-700/50 hover:bg-zinc-900/60"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 transition-colors group-hover:bg-blue-500/15">
                  <feat.icon size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={12} className="shrink-0 text-emerald-400" />
                    <span className="text-sm font-semibold text-zinc-200">{feat.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-10 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-zinc-500">Status</span>
              <span className="font-medium text-emerald-400">Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-zinc-500">Security</span>
              <span className="font-medium text-emerald-400">Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-zinc-600" />
              <span className="text-zinc-500">Version</span>
              <span className="font-medium text-zinc-300">v1.1.0</span>
            </div>
            <div className="flex items-center gap-2">
              <Server size={12} className="text-zinc-600" />
              <span className="text-zinc-500">Environment</span>
              <span className="font-medium text-zinc-300">
                {process.env.NODE_ENV === "development" ? "Development" : "Production"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Card ── */}
      <div className="flex w-full items-center justify-center p-6 lg:w-[58%] lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{APP_NAME}</p>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-zinc-500 uppercase">Admin Panel</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
            <p className="mt-1.5 text-sm text-zinc-400">Sign in to access the administration platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/40 p-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Authentication Error</p>
                  <p className="mt-0.5 text-xs text-red-400/70">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                Email or Username
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                autoComplete="username"
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                className={`w-full rounded-xl border bg-zinc-800/50 px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-500 ${
                  focused === "email"
                    ? "border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                    : "border-zinc-700/60 hover:border-zinc-600"
                }`}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  className={`w-full rounded-xl border bg-zinc-800/50 px-4 py-2.5 pr-10 text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-500 ${
                    focused === "password"
                      ? "border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                      : "border-zinc-700/60 hover:border-zinc-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="licenseKey" className="mb-1.5 block text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                License Key
              </label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="licenseKey"
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                  required
                  autoComplete="off"
                  onFocus={() => setFocused("licenseKey")}
                  onBlur={() => setFocused(null)}
                  className={`w-full rounded-xl border bg-zinc-800/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-zinc-500 font-mono tracking-wider ${
                    focused === "licenseKey"
                      ? "border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                      : "border-zinc-700/60 hover:border-zinc-600"
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Sign In</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-zinc-600">
              Protected by enterprise-grade security &middot; All access is audited
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
