"use client";

import { useState, useMemo } from "react";
import { Search, Building2, Key, Coins, MinusCircle, SlidersHorizontal, CheckCircle, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import AddCoinsModal from "@/components/coins/AddCoinsModal";
import RemoveCoinsModal from "@/components/coins/RemoveCoinsModal";
import SetCoinsModal from "@/components/coins/SetCoinsModal";

interface CoinsPageActionsProps {
  licenses: Array<{
    licenseId: string;
    organization: string;
    key: string;
    balance: number;
  }>;
}

type LicenseInfo = { licenseId: string; organization: string; key: string; balance: number };

const ACTION_CARDS = [
  { key: "grant" as const, label: "Grant Coins", desc: "Add coins to any license balance", icon: Coins, border: "amber", iconColor: "text-amber-400", hoverBorder: "hover:border-amber-400 hover:ring-amber-500/20" },
  { key: "remove" as const, label: "Remove Coins", desc: "Deduct coins from any license", icon: MinusCircle, border: "red", iconColor: "text-red-400", hoverBorder: "hover:border-red-400 hover:ring-red-500/20" },
  { key: "set" as const, label: "Set Balance", desc: "Set exact coin balance for any license", icon: SlidersHorizontal, border: "blue", iconColor: "text-blue-400", hoverBorder: "hover:border-blue-400 hover:ring-blue-500/20" },
];

const BORDER_CLASS: Record<string, string> = {
  amber: "border-amber-500/30 bg-amber-500/5",
  red: "border-red-500/30 bg-red-500/5",
  blue: "border-blue-500/30 bg-blue-500/5",
};

export default function CoinsPageActions({ licenses }: CoinsPageActionsProps) {
  const [activeAction, setActiveAction] = useState<"grant" | "remove" | "set" | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<LicenseInfo | null>(null);
  const [showLicensePicker, setShowLicensePicker] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");
  const [keySearch, setKeySearch] = useState("");

  const filteredLicenses = useMemo(() => {
    const oq = orgSearch.toLowerCase();
    const kq = keySearch.toLowerCase();
    return licenses.filter((l) => {
      const orgMatch = !oq || l.organization.toLowerCase().includes(oq);
      const keyMatch = !kq || l.key.toLowerCase().includes(kq);
      return orgMatch && keyMatch;
    });
  }, [licenses, orgSearch, keySearch]);

  function handleCardClick(action: "grant" | "remove" | "set") {
    setActiveAction(action);
    setOrgSearch("");
    setKeySearch("");
    setSelectedLicense(null);
    setShowLicensePicker(true);
  }

  function handleLicenseSelect(license: LicenseInfo) {
    setSelectedLicense(license);
    setShowLicensePicker(false);
  }

  function handleLicensePickerClose() {
    setShowLicensePicker(false);
    setActiveAction(null);
  }

  const hasSearch = orgSearch || keySearch;

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {ACTION_CARDS.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => handleCardClick(card.key)}
            className={`rounded-xl border p-5 text-left transition-all ${BORDER_CLASS[card.border]} ${card.hoverBorder} group`}
          >
            <div className="flex items-center gap-3 mb-3">
              <card.icon size={24} className={card.iconColor} />
              <div>
                <div className="font-semibold text-zinc-100">{card.label}</div>
                <div className="text-xs text-zinc-500">{card.desc}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
              Choose license <ArrowRight size={10} />
            </div>
          </button>
        ))}
      </div>

      {/* License Picker Modal */}
      <Modal open={showLicensePicker} onClose={handleLicensePickerClose} title="Select License" size="md">
        <div className="space-y-3">
          <div className="relative">
            <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text" placeholder="Search by organization..." value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text" placeholder="Search by license key..." value={keySearch}
              onChange={(e) => setKeySearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-blue-500"
            />
          </div>
        </div>

        {hasSearch && (
          <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-zinc-800">
            {filteredLicenses.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-zinc-500">
                <Search size={14} /> No licenses match your search criteria
              </div>
            ) : (
              filteredLicenses.map((l) => (
                <button
                  key={l.licenseId}
                  type="button"
                  onClick={() => handleLicenseSelect(l)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-800"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-zinc-600">
                    <CheckCircle size={12} className="text-white opacity-0" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-200">{l.organization}</span>
                      <code className="text-xs text-zinc-500">{l.key}</code>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                      <Coins size={10} className="text-amber-400" />
                      {l.balance.toLocaleString()} coins
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {!hasSearch && (
          <div className="mt-4 flex items-center justify-center gap-2 p-6 text-sm text-zinc-500">
            <Search size={14} /> Type to search for a license
          </div>
        )}
      </Modal>

      {/* Action Modals */}
      {selectedLicense && activeAction === "grant" && (
        <AddCoinsModal
          licenseId={selectedLicense.licenseId}
          organization={selectedLicense.organization}
          currentBalance={selectedLicense.balance}
          autoOpen
        />
      )}
      {selectedLicense && activeAction === "remove" && (
        <RemoveCoinsModal
          licenseId={selectedLicense.licenseId}
          organization={selectedLicense.organization}
          currentBalance={selectedLicense.balance}
          autoOpen
        />
      )}
      {selectedLicense && activeAction === "set" && (
        <SetCoinsModal
          licenseId={selectedLicense.licenseId}
          organization={selectedLicense.organization}
          currentBalance={selectedLicense.balance}
          autoOpen
        />
      )}
    </>
  );
}
