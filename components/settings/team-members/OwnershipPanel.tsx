"use client";

import { useState } from "react";
import { downloadCSV } from "@/lib/export";
import TransferOwnershipModal from "./TransferOwnershipModal";

interface Props {
  owner: { id: string; name: string; email: string } | null;
  members: { id: string; name: string; email: string }[];
}

export default function OwnershipPanel({ owner, members }: Props) {
  const [transferOpen, setTransferOpen] = useState(false);

  function handleExportReport() {
    const headers = ["Name", "Email", "Role"];
    const rows = members.map((m) => [m.name, m.email, m.id === owner?.id ? "OWNER" : "MEMBER"]);
    downloadCSV("access-report", headers, rows);
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-xl font-bold">Ownership</h2>
      <div className="mt-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Current Owner</p>
        <p className="mt-2 text-lg font-semibold">{owner?.name || "Unknown"}</p>
        <p className="text-sm text-zinc-500">{owner?.email || "-"}</p>
      </div>
      <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <p className="text-sm text-yellow-400">Ownership Protected</p>
        <p className="mt-1 text-xs text-zinc-400">Transfer requires explicit owner approval.</p>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => setTransferOpen(true)}
          disabled={!owner || members.length < 2}
          className="rounded-xl bg-yellow-600 px-4 py-3 font-medium text-white transition-colors hover:bg-yellow-500 disabled:opacity-50"
        >
          Transfer Ownership
        </button>
        <button
          onClick={handleExportReport}
          className="rounded-xl bg-zinc-800 px-4 py-3 font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          Export Access Report
        </button>
      </div>

      {owner && (
        <TransferOwnershipModal
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          members={members}
          currentOwner={owner}
        />
      )}
    </div>
  );
}
