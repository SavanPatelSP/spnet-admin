"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { usePermission } from "@/hooks/usePermissions";
import { API_ROUTES } from "@/lib/constants";
import { Ban, CheckCircle } from "lucide-react";

interface Props {
  id: string;
  status: string;
  size?: "sm" | "md";
}

export default function ToggleLicenseStatusButton({ id, status, size = "sm" }: Props) {
  const router = useRouter();
  const { hasPermission } = usePermission();

  if (!hasPermission("Toggle License Status")) return null;

  async function toggle() {
    const response = await fetch(API_ROUTES.LICENSES.TOGGLE_STATUS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      router.refresh();
    }
  }

  const isActive = status === "ACTIVE";

  return (
    <ActionButton onClick={toggle} variant={isActive ? "ghost" : "ghost"} size={size}>
      {isActive ? <Ban size={14} className="text-yellow-400" /> : <CheckCircle size={14} className="text-green-400" />}
    </ActionButton>
  );
}
