"use client";

import { PromotionWorkflowModal, type Promotion } from "./PromotionWorkflowModal";

export function PromoCodeModal(props: {
  open: boolean;
  onClose: () => void;
  editingPromotion: Promotion | null;
  allPromotions: Promotion[];
  onSaved: () => void;
}) {
  return <PromotionWorkflowModal {...props} productType="PROMO_CODE" />;
}
