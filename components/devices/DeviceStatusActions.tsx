"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { API_ROUTES } from "@/lib/constants";
import { Ban, CheckCircle, Power, PowerOff, PauseCircle } from "lucide-react";

type DeviceStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLACKLISTED";

interface Props {
  activationId: string;
  status: DeviceStatus;
  onToggle?: () => void;
}

export function DeviceStatusActions({ activationId, status, onToggle }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<DeviceStatus | null>(null);

  async function updateStatus(targetStatus: DeviceStatus) {
    setActionLoading(true);
    try {
      const routeMap: Record<DeviceStatus, string> = {
        ACTIVE: API_ROUTES.DEVICES.ACTIVATE,
        INACTIVE: API_ROUTES.DEVICES.DEACTIVATE,
        SUSPENDED: API_ROUTES.DEVICES.SUSPEND,
        BLACKLISTED: API_ROUTES.DEVICES.BLACKLIST,
      };

      const res = await fetch(routeMap[targetStatus], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activationId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || `Failed to update device status`, "error");
        return;
      }

      setConfirmAction(null);
      onToggle?.();
      router.refresh();
      toast(`Device status updated to ${targetStatus}`, "success");
    } catch {
      toast("Failed to update device status", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWhitelist() {
    setActionLoading(true);
    try {
      const res = await fetch(API_ROUTES.DEVICES.WHITELIST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Failed to whitelist device", "error");
        return;
      }
      onToggle?.();
      router.refresh();
      toast("Device whitelisted", "success");
    } catch {
      toast("Failed to whitelist device", "error");
    } finally {
      setActionLoading(false);
    }
  }

  if (status === "BLACKLISTED") {
    return (
      <ActionButton onClick={handleWhitelist} variant="secondary" size="sm" loading={actionLoading}>
        <CheckCircle size={14} /> Whitelist
      </ActionButton>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {status !== "ACTIVE" && (
          <ActionButton onClick={() => updateStatus("ACTIVE")} variant="secondary" size="sm" loading={actionLoading}>
            <Power size={14} /> Activate
          </ActionButton>
        )}
        {status !== "INACTIVE" && (
          <ActionButton onClick={() => setConfirmAction("INACTIVE")} variant="secondary" size="sm" loading={actionLoading}>
            <PowerOff size={14} /> Deactivate
          </ActionButton>
        )}
        {status !== "SUSPENDED" && (
          <ActionButton onClick={() => setConfirmAction("SUSPENDED")} variant="secondary" size="sm" loading={actionLoading}>
            <PauseCircle size={14} /> Suspend
          </ActionButton>
        )}
        <ActionButton onClick={() => setConfirmAction("BLACKLISTED")} variant="danger" size="sm" loading={actionLoading}>
          <Ban size={14} /> Blacklist
        </ActionButton>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => { if (confirmAction) await updateStatus(confirmAction); }}
        title={
          confirmAction === "BLACKLISTED"
            ? "Blacklist Device"
            : confirmAction === "SUSPENDED"
            ? "Suspend Device"
            : "Deactivate Device"
        }
        description={
          confirmAction === "BLACKLISTED"
            ? "This device will be blocked from all activations. Are you sure?"
            : confirmAction === "SUSPENDED"
            ? "This device will be temporarily suspended from using the license."
            : "This device will be deactivated and unable to use the license until reactivated."
        }
        confirmLabel={
          confirmAction === "BLACKLISTED"
            ? "Blacklist Device"
            : confirmAction === "SUSPENDED"
            ? "Suspend Device"
            : "Deactivate Device"
        }
        variant={confirmAction === "BLACKLISTED" ? "danger" : "primary"}
        loading={actionLoading}
      />
    </>
  );
}
