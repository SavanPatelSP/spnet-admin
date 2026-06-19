"use client";

import { PromotionWorkflowModal, type Promotion } from "./PromotionWorkflowModal";

export function FreeTrialOfferModal(props: {
  open: boolean;
  onClose: () => void;
  editingPromotion: Promotion | null;
  allPromotions: Promotion[];
  onSaved: () => void;
}) {
  return <PromotionWorkflowModal {...props} productType="FREE_TRIAL" />;
}
