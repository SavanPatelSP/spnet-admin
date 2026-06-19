import { Crown, Star, GraduationCap, BarChart3, Zap, Briefcase, Sparkles, type LucideIcon } from "lucide-react";

export const ALL_PLANS = ["FREE", "BASIC", "STUDENT", "PLUS", "PRO", "BUSINESS", "ENTERPRISE", "SP_PLAN"];

export interface PlanMeta {
  label: string;
  color: string;
  description: string;
  badge?: string;
  icon: LucideIcon;
  tier: number;
}

export const PLAN_META: Record<string, PlanMeta> = {
  FREE:       { label: "FREE",       color: "zinc",   description: "Getting started",                    badge: "Free Forever",  icon: Star,           tier: 0 },
  BASIC:      { label: "BASIC",      color: "zinc",   description: "Essential features",                badge: "Entry Level",   icon: Star,           tier: 1 },
  STUDENT:    { label: "STUDENT",    color: "green",  description: "Discounted premium for students",   badge: "Education",     icon: GraduationCap,  tier: 2 },
  PLUS:       { label: "PLUS",       color: "blue",   description: "For growing teams",                 badge: "Popular",       icon: BarChart3,      tier: 3 },
  PRO:        { label: "PRO",        color: "purple", description: "Professional toolkit",              badge: "Recommended",   icon: Zap,            tier: 4 },
  BUSINESS:   { label: "BUSINESS",   color: "amber",  description: "Enterprise ready",                  badge: "Best Value",    icon: Briefcase,      tier: 5 },
  ENTERPRISE: { label: "ENTERPRISE", color: "red",    description: "Maximum power",                     badge: "Ultimate",      icon: Crown,          tier: 6 },
  SP_PLAN:    { label: "SP\u2019s Plan", color: "cyan", description: "Exclusive flagship tier",          badge: "Top Tier",      icon: Sparkles,      tier: 7 },
};

export const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  FREE: [
    "Basic access included",
    "Community support",
    "Standard encryption",
  ],
  BASIC: [
    "Increased limits from FREE",
    "Basic access control",
    "Email support",
    "Enhanced dashboard",
    "Up to 3 users",
  ],
  STUDENT: [
    "Discounted premium access",
    "Premium badge included",
    "Priority support queue",
    "Enhanced upload limits",
    "Extended storage capacity",
    "Student-friendly pricing",
  ],
  PLUS: [
    "Everything in BASIC, plus:",
    "Team management tools",
    "Basic analytics dashboard",
    "Priority messaging queue",
    "HD media processing",
    "Growing team features",
  ],
  PRO: [
    "Everything in PLUS, plus:",
    "Advanced analytics & reporting",
    "Custom branding support",
    "Batch media operations",
    "Faster uploads & downloads",
    "Priority chat & email support",
    "Full audit trail access",
  ],
  BUSINESS: [
    "Everything in PRO, plus:",
    "Organization management",
    "Bulk operations at scale",
    "Dedicated support team",
    "99.9% SLA uptime guarantee",
    "SSO/SAML & compliance",
    "Full API & webhook access",
    "Up to 25 devices & team licenses",
  ],
  ENTERPRISE: [
    "Everything in BUSINESS, plus:",
    "Unlimited team & device scale",
    "24/7 dedicated account manager",
    "1-hour response SLA (99.99%)",
    "White-label branding",
    "AI-powered media processing",
    "Custom development pipeline",
    "Global CDN & custom retention",
  ],
  SP_PLAN: [
    "Everything in ENTERPRISE, plus:",
    "Priority infrastructure allocation",
    "Concierge onboarding & migration",
    "Custom feature development SLA",
    "Direct engineering access",
    "Early access to all new features",
    "Executive sponsorship & reviews",
  ],
};

export const PLAN_FEATURES_BY_CATEGORY: Record<string, Record<string, string[]>> = {
  FREE: {
    Messaging: ["Up to 100 messages/day", "Basic messaging"],
    Storage: ["1 GB file storage", "Standard uploads (5 MB)"],
    Media: ["Basic media processing", "Standard resolution"],
    Administration: ["Basic dashboard", "Single user"],
    Support: ["Community access", "72hr response"],
    Security: ["Standard encryption"],
  },
  BASIC: {
    Messaging: ["Up to 500 messages/day", "Message history", "Basic messaging"],
    Storage: ["5 GB file storage", "Standard uploads (10 MB)"],
    Media: ["Basic media processing", "Standard resolution"],
    Administration: ["Enhanced dashboard", "Up to 3 users"],
    Support: ["Email support", "48hr response"],
    Security: ["Standard encryption", "Basic access control"],
  },
  STUDENT: {
    Messaging: ["Up to 2,000 messages/day", "Extended message history", "Priority messaging"],
    Storage: ["25 GB file storage", "Enhanced uploads (25 MB)"],
    Media: ["Standard media processing", "HD resolution"],
    Administration: ["Basic analytics", "Single user management"],
    Support: ["Priority email support", "24hr response", "Chat support"],
    Security: ["Enhanced encryption", "Basic access control"],
    "Licensing Benefits": ["Student-discounted pricing", "Education license"],
  },
  PLUS: {
    Messaging: ["Up to 1,000 messages/day", "Message history", "Priority messaging"],
    Storage: ["10 GB file storage", "Enhanced uploads (25 MB)"],
    Media: ["Standard media processing", "HD resolution"],
    Administration: ["Basic analytics dashboard", "Team management", "Single user management"],
    Support: ["Email support", "48hr response"],
    Security: ["Standard encryption", "Basic access control"],
  },
  PRO: {
    Messaging: ["Up to 10,000 messages/day", "Extended message history", "Priority messaging"],
    Storage: ["50 GB file storage", "Enhanced uploads (50 MB)", "Faster downloads"],
    Media: ["Advanced media processing", "HD resolution", "Batch media ops"],
    Administration: ["Advanced analytics dashboard", "Team management", "Custom branding"],
    Support: ["Priority email support", "12hr response", "Chat support"],
    Security: ["Enhanced encryption", "Advanced access control", "Audit logs"],
    "Business Tools": ["Basic API access"],
  },
  BUSINESS: {
    Messaging: ["Unlimited messages", "Full message history", "Priority messaging", "Bulk messaging"],
    Storage: ["250 GB file storage", "Business uploads (200 MB)", "CDN delivery"],
    Media: ["Premium media processing", "4K resolution", "Bulk media operations"],
    Administration: ["Premium analytics & reports", "Organization management", "Bulk operations", "Custom integrations"],
    Support: ["Dedicated support", "4hr response", "Phone & chat", "SLA: 99.9%"],
    Security: ["Enterprise encryption", "Advanced audit logs", "Compliance reporting", "SSO/SAML"],
    "Business Tools": ["Full API access", "Webhooks", "Custom integrations"],
    "Licensing Benefits": ["Up to 25 devices", "Team licenses", "Multi-org support"],
  },
  ENTERPRISE: {
    Messaging: ["Unlimited everything", "Real-time messaging", "Priority routing", "Custom integrations"],
    Storage: ["Unlimited storage", "Unlimited uploads", "Global CDN", "Custom retention"],
    Media: ["Enterprise media suite", "8K + HDR", "AI-powered processing", "Custom pipelines"],
    Administration: ["Enterprise analytics suite", "Unlimited team scale", "White-label branding", "Priority feature access", "Custom development"],
    Support: ["24/7 dedicated support", "1hr response", "Dedicated account manager", "SLA: 99.99%"],
    Security: ["Maximum encryption", "Comprehensive audit logs", "Compliance reporting", "Dedicated security", "Custom policies"],
    "Business Tools": ["Full API access", "Advanced webhooks", "Custom integrations", "Dedicated infrastructure"],
    "Licensing Benefits": ["Unlimited devices", "Unlimited team scale", "Global licensing", "Priority allocations"],
  },
  SP_PLAN: {
    Messaging: ["Unlimited everything", "Real-time priority routing", "Custom integration pipeline", "Private messaging channels"],
    Storage: ["Unlimited storage", "Custom retention policies", "Global edge CDN", "Dedicated storage clusters"],
    Media: ["Enterprise media suite", "8K + HDR + immersive", "AI-powered processing", "Custom development pipeline"],
    Administration: ["Enterprise analytics suite", "Unlimited team scale", "White-label branding", "Priority feature access", "Dedicated development sprints", "Executive business reviews"],
    Support: ["Concierge support", "15min response", "Dedicated account team", "SLA: 99.995%", "Direct engineering access"],
    Security: ["Maximum encryption", "Comprehensive audit logs", "Custom security policies", "Dedicated security team", "Penetration testing included"],
    "Business Tools": ["Full API access", "Custom webhook infrastructure", "Dedicated infrastructure", "Custom integrations SLA"],
    "Licensing Benefits": ["Unlimited devices & teams", "Global licensing", "Priority allocations", "Custom license terms"],
  },
};

const featureListCache: Record<string, string[]> = {};
export function getPlanFeatureList(plan: string): string[] {
  if (!featureListCache[plan]) {
    const cats = PLAN_FEATURES_BY_CATEGORY[plan];
    featureListCache[plan] = cats ? Object.values(cats).flat() : [];
  }
  return featureListCache[plan];
}

export function getPlanCategories(plan: string): string[] {
  const cats = PLAN_FEATURES_BY_CATEGORY[plan];
  return cats ? Object.keys(cats) : [];
}

export function getPlanIndex(plan: string): number {
  return ALL_PLANS.indexOf(plan);
}

export function getNextPlan(plan: string): string | null {
  const i = getPlanIndex(plan);
  return i >= 0 && i < ALL_PLANS.length - 1 ? ALL_PLANS[i + 1] : null;
}

export function getPrevPlan(plan: string): string | null {
  const i = getPlanIndex(plan);
  return i > 0 ? ALL_PLANS[i - 1] : null;
}

export function getPlanComparison(from: string, to: string): {
  added: string[];
  removed: string[];
  common: string[];
} {
  const fromFeatures = new Set(getPlanFeatureList(from));
  const toFeatures = new Set(getPlanFeatureList(to));
  const added = [...toFeatures].filter((f) => !fromFeatures.has(f));
  const removed = [...fromFeatures].filter((f) => !toFeatures.has(f));
  const common = [...fromFeatures].filter((f) => toFeatures.has(f));
  return { added, removed, common };
}

export function getPlanUpgradePath(plan: string): { current: string; next: string | null; gained: string[] } | null {
  const next = getNextPlan(plan);
  if (!next) return null;
  const comparison = getPlanComparison(plan, next);
  return { current: plan, next, gained: comparison.added };
}

import { PLAN_PRICES } from "./constants";

export function getPlanMonthlyPrice(plan: string): number {
  return PLAN_PRICES[plan as keyof typeof PLAN_PRICES] ?? 0;
}

export function getPlanYearlyPrice(plan: string): number {
  return getPlanMonthlyPrice(plan) * 12;
}

export function getPlanLifetimePrice(plan: string): number {
  return getPlanMonthlyPrice(plan) * 120;
}

export function getPlanPricing(plan: string): { monthly: number; yearly: number; lifetime: number } {
  const monthly = getPlanMonthlyPrice(plan);
  return {
    monthly,
    yearly: monthly * 12,
    lifetime: monthly * 120,
  };
}
