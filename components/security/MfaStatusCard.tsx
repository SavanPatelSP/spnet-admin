"use client";

import { Shield, ShieldCheck, AlertTriangle } from "lucide-react";

export function MfaStatusCard({
  mfaEnabled,
  totalUsers,
}: {
  mfaEnabled: number;
  totalUsers: number;
}) {
  const adoptionRate = totalUsers > 0 ? Math.round((mfaEnabled / totalUsers) * 100) : 0;

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-lg font-bold text-zinc-100">Multi-Factor Authentication</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-zinc-800/50 p-4">
          <div className="flex items-center gap-3">
            {adoptionRate >= 50 ? (
              <ShieldCheck size={20} className="text-green-400" />
            ) : adoptionRate > 0 ? (
              <Shield size={20} className="text-yellow-400" />
            ) : (
              <AlertTriangle size={20} className="text-red-400" />
            )}
            <div>
              <p className="text-sm font-medium text-zinc-200">MFA Adoption Rate</p>
              <p className="text-xs text-zinc-500">{mfaEnabled} of {totalUsers} users</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-zinc-100">{adoptionRate}%</span>
        </div>

        <div className="h-2 rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${adoptionRate}%` }}
          />
        </div>

        <p className="text-xs text-zinc-500">
          {adoptionRate === 0
            ? "MFA is not enabled for any users. Enable MFA to add an extra layer of security."
            : adoptionRate < 50
            ? "MFA adoption is low. Encourage users to enable two-factor authentication."
            : "Good MFA adoption rate across the platform."}
        </p>
      </div>
    </div>
  );
}
