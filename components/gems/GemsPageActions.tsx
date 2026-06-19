"use client";

import { useState, useMemo } from "react";
import { Gem, MinusCircle, SlidersHorizontal, Search, Building2, Key, CheckCircle, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import GrantGemsModal from "@/components/gems/GrantGemsModal";
import RevokeGemsModal from "@/components/gems/RevokeGemsModal";
import SetGemsModal from "@/components/gems/SetGemsModal";

interface LicenseInfo {
  licenseId: string;
  organization: string;
  key: string;
  balance: number;
}

interface GemRewardOption {
  id: string;
  name: string;
  amount: number;
  description: string | null;
}

interface GemsPageActionsProps {
  licenses: LicenseInfo[];
  rewards?: GemRewardOption[];
}

const actionCards = [
  {
    action: "grant" as const,
    title: "Grant Gems",
    description: "Add premium gems to a license balance.",
    icon: Gem,
    color: "purple",
    borderClass: "border-purple-500/20 hover:border-purple-500/50",
    bgClass: "bg-purple-500/10",
    iconBgClass: "bg-purple-500/20 text-purple-400",
    gradientClass: "from-purple-600/10 via-transparent to-transparent",
  },
  {
    action: "revoke" as const,
    title: "Revoke Gems",
    description: "Remove premium gems from a license balance.",
    icon: MinusCircle,
    color: "red",
    borderClass: "border-red-500/20 hover:border-red-500/50",
    bgClass: "bg-red-500/10",
    iconBgClass: "bg-red-500/20 text-red-400",
    gradientClass: "from-red-600/10 via-transparent to-transparent",
  },
  {
    action: "set" as const,
    title: "Set Balance",
    description: "Set an exact gem balance for a license.",
    icon: SlidersHorizontal,
    color: "blue",
    borderClass: "border-blue-500/20 hover:border-blue-500/50",
    bgClass: "bg-blue-500/10",
    iconBgClass: "bg-blue-500/20 text-blue-400",
    gradientClass: "from-blue-600/10 via-transparent to-transparent",
  },
];

export default function GemsPageActions({ licenses, rewards }: GemsPageActionsProps) {
  const [activeAction, setActiveAction] = useState<"grant" | "revoke" | "set" | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<LicenseInfo | null>(null);
  const [showLicensePicker, setShowLicensePicker] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");
  const [keySearch, setKeySearch] = useState("");

  const filteredLicenses = useMemo(() => {
    return licenses.filter((l) => {
      const matchesOrg = l.organization.toLowerCase().includes(orgSearch.toLowerCase());
      const matchesKey = l.key.toLowerCase().includes(keySearch.toLowerCase());
      return matchesOrg && matchesKey;
    });
  }, [licenses, orgSearch, keySearch]);

  function handleCardClick(action: "grant" | "revoke" | "set") {
    setActiveAction(action);
    setSelectedLicense(null);
    setOrgSearch("");
    setKeySearch("");
    setShowLicensePicker(true);
  }

  function handleLicenseSelect(license: LicenseInfo) {
    setSelectedLicense(license);
    setShowLicensePicker(false);
  }

  function handleModalClose() {
    setSelectedLicense(null);
    setActiveAction(null);
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {actionCards.map((card) => (
          <button
            key={card.action}
            onClick={() => handleCardClick(card.action)}
            className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition-all ${card.borderClass}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradientClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative z-10 flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${card.iconBgClass}`}>
                <card.icon size={24} />
              </div>
              <div className="min-w-0">
                <h3 className={`text-lg font-bold ${card.color === "purple" ? "text-purple-400" : card.color === "red" ? "text-red-400" : "text-blue-400"}`}>{card.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{card.description}</p>
              </div>
              <ArrowRight size={20} className="mt-1 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>

      <Modal
        open={showLicensePicker}
        onClose={() => { setShowLicensePicker(false); setActiveAction(null); }}
        title="Select License"
        description={`Choose a license to ${activeAction ?? ""} gems.`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by organization..."
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-600"
              />
            </div>
            <div className="relative flex-1">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by license key..."
                value={keySearch}
                onChange={(e) => setKeySearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {filteredLicenses.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Search size={32} className="mb-2 text-zinc-600" />
                <p className="text-sm text-zinc-500">No licenses match your search.</p>
              </div>
            ) : (
              filteredLicenses.map((license) => (
                <button
                  key={license.licenseId}
                  onClick={() => handleLicenseSelect(license)}
                  className="flex w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
                    <Gem size={18} className="text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-100">{license.organization}</span>
                      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                        {license.key}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      Balance: <span className="font-medium text-purple-400">{license.balance.toLocaleString()}</span> gems
                    </p>
                  </div>
                  <CheckCircle size={18} className="shrink-0 text-zinc-600" />
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      {selectedLicense && activeAction === "grant" && (
        <GrantGemsModal
          licenseId={selectedLicense.licenseId}
          organization={selectedLicense.organization}
          currentBalance={selectedLicense.balance}
          rewards={rewards}
          autoOpen
        />
      )}

      {selectedLicense && activeAction === "revoke" && (
        <RevokeGemsModal
          licenseId={selectedLicense.licenseId}
          organization={selectedLicense.organization}
          currentBalance={selectedLicense.balance}
          autoOpen
        />
      )}

      {selectedLicense && activeAction === "set" && (
        <SetGemsModal
          licenseId={selectedLicense.licenseId}
          organization={selectedLicense.organization}
          currentBalance={selectedLicense.balance}
          autoOpen
        />
      )}
    </div>
  );
}
