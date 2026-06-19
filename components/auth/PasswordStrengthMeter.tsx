"use client";

import { useMemo } from "react";

interface PasswordStrengthMeterProps {
  password: string;
  confirmPassword?: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrengthMeter({ password, confirmPassword }: PasswordStrengthMeterProps) {
  const requirements: Requirement[] = useMemo(
    () => [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(password) },
      { label: "One lowercase letter", met: /[a-z]/.test(password) },
      { label: "One number", met: /[0-9]/.test(password) },
      { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  const strength = useMemo(() => requirements.filter((r) => r.met).length, [requirements]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return "Enter a password";
    if (strength <= 2) return "Weak";
    if (strength <= 4) return "Moderate";
    return "Strong";
  }, [strength, password.length]);

  const strengthColor = useMemo(() => {
    if (password.length === 0) return "bg-zinc-700";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 4) return "bg-yellow-500";
    return "bg-emerald-500";
  }, [strength, password.length]);

  const passwordsMatch = confirmPassword === undefined || password === confirmPassword;

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Password strength</span>
          <span className={`font-medium ${strength <= 2 && password.length > 0 ? "text-red-400" : strength <= 4 ? "text-yellow-400" : "text-emerald-400"}`}>
            {strengthLabel}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${(strength / requirements.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1.5">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-2 text-xs">
            <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${req.met ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-600"}`}>
              {req.met ? "✓" : "•"}
            </span>
            <span className={req.met ? "text-zinc-300" : "text-zinc-500"}>{req.label}</span>
          </li>
        ))}
      </ul>

      {confirmPassword !== undefined && !passwordsMatch && password.length > 0 && confirmPassword.length > 0 && (
        <p className="text-xs text-red-400">Passwords do not match</p>
      )}
    </div>
  );
}
