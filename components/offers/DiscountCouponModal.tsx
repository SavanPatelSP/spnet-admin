"use client";

import { PromotionWorkflowModal, type Promotion } from "./PromotionWorkflowModal";

export function DiscountCouponModal(props: {
  open: boolean;
  onClose: () => void;
  editingPromotion: Promotion | null;
  allPromotions: Promotion[];
  onSaved: () => void;
}) {
  return <PromotionWorkflowModal {...props} productType="DISCOUNT_COUPON" />;
}
