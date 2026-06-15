"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { API_ROUTES } from "@/lib/constants";
import { useState } from "react";
import { Download, AlertTriangle, FileSpreadsheet, ShieldAlert } from "lucide-react";

export default function LicensingAdminActions() {
  const router = useRouter();
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  async function handleExport() {
    window.print();
  }

  async function handleEmergencyLockdown() {
    await fetch(API_ROUTES.LICENSES.EMERGENCY_MODE, { method: "POST" });
    setEmergencyOpen(false);
    router.refresh();
  }

  return (
    <>
      <ActionButton onClick={handleExport} variant="secondary" size="md">
        <Download size={16} /> Export
      </ActionButton>

      <ActionButton onClick={() => setEmergencyOpen(true)} variant="danger" size="md">
        <ShieldAlert size={16} /> Emergency Lockdown
      </ActionButton>

      <ConfirmDialog
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onConfirm={handleEmergencyLockdown}
        title="Emergency Lockdown"
        description="This will suspend ALL active licenses immediately. All activated devices will be deactivated. This action is logged and should only be used in security incidents."
        confirmLabel="Lockdown All Licenses"
        variant="danger"
      />
    </>
  );
}
