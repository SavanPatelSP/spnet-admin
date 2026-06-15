"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { useEffect, useState } from "react";
import { ToggleLeft, ToggleRight } from "lucide-react";

interface Props {
  id: string;
  enabled: boolean;
  name: string;
}

export default function PolicyActions({ id, enabled, name }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function toggle() {
    const response = await fetch(API_ROUTES.SECURITY.TOGGLE_POLICY, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    if (response.ok) router.refresh();
  }

  return mounted ? (
    <ActionButton onClick={toggle} variant={enabled ? "secondary" : "primary"} size="sm">
      {enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
      {enabled ? "Disable" : "Enable"}
    </ActionButton>
  ) : null;
}
