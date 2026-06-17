"use client";

import { useState } from "react";
import BulkCreateLicenseModal from "@/components/licenses/BulkCreateLicenseModal";
import { ActionButton } from "@/components/ui/ActionButton";
import { CopyPlus } from "lucide-react";

interface Props {
  templates: { id: string; name: string }[];
}

export default function BulkCreateButton({ templates }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} variant="secondary" size="md">
        <CopyPlus size={16} /> Bulk Create
      </ActionButton>
      <BulkCreateLicenseModal
        open={open}
        onClose={() => setOpen(false)}
        templates={templates}
      />
    </>
  );
}
