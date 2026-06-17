"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ActionButton } from "@/components/ui/ActionButton";
import { API_ROUTES } from "@/lib/constants";
import { Trash2 } from "lucide-react";

interface Props {
  rewardId: string;
  rewardName: string;
}

export default function DeleteRewardButton({ rewardId, rewardName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    const res = await fetch(API_ROUTES.GEMS.REWARDS_DELETE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rewardId }),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="danger" size="sm">
        <Trash2 size={14} /> Delete
      </ActionButton>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Delete Reward"
        description={`Are you sure you want to delete "${rewardName}"? This action cannot be undone.`}
        confirmLabel="Delete Reward"
        variant="danger"
      />
    </>
  );
}
