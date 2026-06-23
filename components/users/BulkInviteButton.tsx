"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { BulkInviteModal } from "@/components/users/BulkInviteModal";
import { usePermission } from "@/hooks/usePermissions";
import { UserPlus } from "lucide-react";

interface Props {
  roles: { id: string; name: string }[];
}

export default function BulkInviteButton({ roles }: Props) {
  const { hasPermission } = usePermission();
  const [open, setOpen] = useState(false);

  if (!hasPermission("Bulk Invite Users")) return null;

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="primary" size="sm">
        <UserPlus size={14} /> Bulk Invite
      </ActionButton>
      <BulkInviteModal roles={roles} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
