"use client";

import { PromotionWorkflowModal, type Promotion } from "./PromotionWorkflowModal";

export function CampaignModal(props: {
  open: boolean;
  onClose: () => void;
  editingPromotion: Promotion | null;
  allPromotions: Promotion[];
  onSaved: () => void;
}) {
  return <PromotionWorkflowModal {...props} productType="CAMPAIGN" />;
}
