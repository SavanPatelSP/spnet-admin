"use client";

import { PromotionWorkflowModal, type Promotion } from "./PromotionWorkflowModal";

export function UpgradePromotionModal(props: {
  open: boolean;
  onClose: () => void;
  editingPromotion: Promotion | null;
  allPromotions: Promotion[];
  onSaved: () => void;
}) {
  return <PromotionWorkflowModal {...props} productType="UPGRADE_PROMOTION" />;
}
