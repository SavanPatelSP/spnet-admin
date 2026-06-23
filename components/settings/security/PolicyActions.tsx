"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { API_ROUTES } from "@/lib/constants";
import { usePermission } from "@/hooks/usePermissions";
import { ToggleLeft, ToggleRight } from "lucide-react";

interface Props {
  id: string;
  enabled: boolean;
  name: string;
}

export default function PolicyActions({ id, enabled, name }: Props) {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_ROUTES.SECURITY.TOGGLE_POLICY, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: !enabled }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to toggle policy");
        return;
      }
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!hasPermission("Toggle Security Policies")) return null;

  return (
    <>
      <ActionButton onClick={() => setConfirmOpen(true)} variant={enabled ? "secondary" : "primary"} size="sm">
        {enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        {enabled ? "Disable" : "Enable"}
      </ActionButton>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={toggle}
        title={enabled ? "Disable Security Policy" : "Enable Security Policy"}
        description={`Are you sure you want to ${enabled ? "disable" : "enable"} "${name}"? This affects system security posture.`}
        confirmLabel={enabled ? "Disable" : "Enable"}
        variant={enabled ? "danger" : "primary"}
        loading={loading}
        error={error}
      />
    </>
  );
}
