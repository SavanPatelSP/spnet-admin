export {
  PREMIUM_PLANS,
  ALL_PLAN_IDS as ALL_PLANS,
  getPlanById,
  getPlanList,
  getPlanPricing,
  getDailyPrice,
  getWeeklyPrice,
  getMonthlyPrice,
  getYearlyPrice,
  getLifetimePrice,
  getFeatureList as getPlanFeatureList,
  getFeatureCategories as getPlanCategories,
  getPlanIndex,
  getNextPlan,
  getPrevPlan,
  getPlanComparison,
  getPlanUpgradePath,
  getDurationDays,
  getAllComparisonFeatures,
  PLAN_COLORS,
  PLAN_GRADIENTS,
  PLAN_CSS_COLORS,
  PLAN_SELECT_COLORS,
  PLAN_BORDER_COLORS,
  SUBSCRIPTION_TYPE_LABELS,
  DURATION_DAYS,
  exportPlanConfig,
} from "./premium-config";

export type {
  PlanId,
  PlanDefinition,
  PlanMetaConfig,
  PlanFeatureGroup,
  PlanPriceConfig,
  PriceBreakdown,
  PlanStoreData,
  PlanConfigExport,
  PlanColorSet,
} from "./premium-config";

import { PREMIUM_PLANS, getPlanById, getPlanIndex, getNextPlan, getPrevPlan, getFeatureList, getFeatureCategories, getPlanComparison, getPlanUpgradePath, PLAN_CSS_COLORS, getMonthlyPrice, getYearlyPrice, getLifetimePrice } from "./premium-config";
import type { LucideIcon } from "lucide-react";

export interface PlanMeta {
  label: string;
  color: string;
  description: string;
  badge?: string;
  icon: LucideIcon;
  tier: number;
}

export const PLAN_META: Record<string, PlanMeta> = {};
for (const id of Object.keys(PREMIUM_PLANS)) {
  const plan = PREMIUM_PLANS[id as keyof typeof PREMIUM_PLANS];
  PLAN_META[id] = {
    label: plan.meta.label,
    color: plan.meta.color,
    description: plan.meta.description,
    badge: plan.meta.badge ?? undefined,
    icon: plan.meta.icon,
    tier: plan.meta.priority,
  };
}

export const PLAN_HIGHLIGHTS: Record<string, string[]> = {};
for (const id of Object.keys(PREMIUM_PLANS)) {
  PLAN_HIGHLIGHTS[id] = PREMIUM_PLANS[id as keyof typeof PREMIUM_PLANS].highlights;
}

export const PLAN_FEATURES_BY_CATEGORY: Record<string, Record<string, string[]>> = {};
for (const id of Object.keys(PREMIUM_PLANS)) {
  PLAN_FEATURES_BY_CATEGORY[id] = PREMIUM_PLANS[id as keyof typeof PREMIUM_PLANS].featuresByCategory;
}

export { PLAN_CSS_COLORS as colorConfig };
