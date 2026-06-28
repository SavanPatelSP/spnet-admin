import {
  Shield, Sparkles, GraduationCap, Gem, Rocket, Building, Crown, Flame, Star,
  type LucideIcon,
} from "lucide-react";

export const ALL_PLAN_IDS = ["FREE", "BASIC", "STUDENT", "PLUS", "PRO", "BUSINESS", "ENTERPRISE", "EXTREME", "SP_PLAN"] as const;
export type PlanId = (typeof ALL_PLAN_IDS)[number];

export interface PriceBreakdown {
  monthly: number;
  daily: number;
  weekly: number;
  yearly: number;
  lifetime: number;
}

export interface PlanPriceConfig {
  basePrice: number;
  calculatedPrice: number | null;
  customPrice: number | null;
  discount: number;
  savings: number;
  currency: string;
}

export interface PlanMetaConfig {
  id: PlanId;
  label: string;
  description: string;
  color: string;
  gradient: string;
  icon: LucideIcon;
  iconName: string;
  priority: number;
  badge: string | null;
  visibility: boolean;
  displayOrder: number;
  recommendedTag: boolean;
  popularTag: boolean;
  bestValueTag: boolean;
}

export interface PlanFeatureGroup {
  category: string;
  features: string[];
}

export interface PlanStoreData {
  title: string;
  subtitle: string;
  marketingText: string;
  cardGradient: string;
  cardColor: string;
  iconName: string;
  comparisonFeatures: string[];
  benefits: string[];
  storeOrder: number;
  visibility: boolean;
  recommendedStatus: boolean;
}

export interface PlanDefinition {
  meta: PlanMetaConfig;
  highlights: string[];
  featuresByCategory: Record<string, string[]>;
  pricing: PriceBreakdown;
  store: PlanStoreData;
}

const DAILY_FACTOR = 1 / 30;
const WEEKLY_FACTOR = 7 / 30;
const YEARLY_FACTOR = 12;
const LIFETIME_FACTOR = 120;

function calcPricing(monthlyPrice: number): PriceBreakdown {
  return {
    monthly: monthlyPrice,
    daily: Math.round(monthlyPrice * DAILY_FACTOR * 100) / 100,
    weekly: Math.round(monthlyPrice * WEEKLY_FACTOR * 100) / 100,
    yearly: monthlyPrice * YEARLY_FACTOR,
    lifetime: monthlyPrice * LIFETIME_FACTOR,
  };
}

export const PREMIUM_PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    meta: {
      id: "FREE",
      label: "Free",
      description: "Getting started with basic access",
      color: "gray",
      gradient: "from-gray-500/10 to-zinc-900",
      icon: Shield,
      iconName: "Shield",
      priority: 0,
      badge: null,
      visibility: true,
      displayOrder: 0,
      recommendedTag: false,
      popularTag: false,
      bestValueTag: false,
    },
    highlights: [
      "Basic access included",
      "Community support",
      "Standard encryption",
    ],
    featuresByCategory: {
      Messaging: ["Up to 100 messages/day", "Basic messaging"],
      Storage: ["1 GB file storage", "Standard uploads (5 MB)"],
      Media: ["Basic media processing", "Standard resolution"],
      Administration: ["Basic dashboard", "Single user"],
      Support: ["Community access", "72hr response"],
      Security: ["Standard encryption"],
    },
    pricing: calcPricing(0),
    store: {
      title: "Free",
      subtitle: "Get started for free",
      marketingText: "Perfect for trying out the platform with basic features.",
      cardGradient: "from-gray-500/5 to-zinc-900",
      cardColor: "gray",
      iconName: "Shield",
      comparisonFeatures: ["Basic messaging", "1 GB storage", "Community support"],
      benefits: ["No cost", "Basic features", "Community support"],
      storeOrder: 0,
      visibility: true,
      recommendedStatus: false,
    },
  },

  BASIC: {
    meta: {
      id: "BASIC",
      label: "Basic",
      description: "Essential features for everyday use",
      color: "blue",
      gradient: "from-blue-500/10 to-zinc-900",
      icon: Sparkles,
      iconName: "Sparkles",
      priority: 1,
      badge: null,
      visibility: true,
      displayOrder: 1,
      recommendedTag: false,
      popularTag: false,
      bestValueTag: false,
    },
    highlights: [
      "Increased limits from FREE",
      "Basic access control",
      "Email support",
      "Enhanced dashboard",
      "Up to 3 users",
    ],
    featuresByCategory: {
      Messaging: ["Up to 500 messages/day", "Message history", "Basic messaging"],
      Storage: ["5 GB file storage", "Standard uploads (10 MB)"],
      Media: ["Basic media processing", "Standard resolution"],
      Administration: ["Enhanced dashboard", "Up to 3 users"],
      Support: ["Email support", "48hr response"],
      Security: ["Standard encryption", "Basic access control"],
    },
    pricing: calcPricing(4),
    store: {
      title: "Basic",
      subtitle: "Essential features",
      marketingText: "For users who need more than the basics with affordable pricing.",
      cardGradient: "from-blue-500/5 to-zinc-900",
      cardColor: "blue",
      iconName: "Sparkles",
      comparisonFeatures: ["Up to 500 messages/day", "5 GB storage", "Email support"],
      benefits: ["Affordable upgrade", "More storage", "Email support"],
      storeOrder: 1,
      visibility: true,
      recommendedStatus: false,
    },
  },

  STUDENT: {
    meta: {
      id: "STUDENT",
      label: "Student",
      description: "Discounted premium for students",
      color: "indigo",
      gradient: "from-indigo-500/10 to-zinc-900",
      icon: GraduationCap,
      iconName: "GraduationCap",
      priority: 2,
      badge: null,
      visibility: true,
      displayOrder: 2,
      recommendedTag: false,
      popularTag: false,
      bestValueTag: false,
    },
    highlights: [
      "Discounted premium access",
      "Premium badge included",
      "Priority support queue",
      "Enhanced upload limits",
      "Extended storage capacity",
      "Student-friendly pricing",
    ],
    featuresByCategory: {
      Messaging: ["Up to 2,000 messages/day", "Extended message history", "Priority messaging"],
      Storage: ["25 GB file storage", "Enhanced uploads (25 MB)"],
      Media: ["Standard media processing", "HD resolution"],
      Administration: ["Basic analytics", "Single user management"],
      Support: ["Priority email support", "24hr response", "Chat support"],
      Security: ["Enhanced encryption", "Basic access control"],
      "Licensing Benefits": ["Student-discounted pricing", "Education license"],
    },
    pricing: calcPricing(6),
    store: {
      title: "Student",
      subtitle: "Discounted for students",
      marketingText: "Verified students get premium features at a special discounted rate.",
      cardGradient: "from-indigo-500/5 to-zinc-900",
      cardColor: "indigo",
      iconName: "GraduationCap",
      comparisonFeatures: ["Priority messaging", "25 GB storage", "Priority support"],
      benefits: ["Student discount", "Premium features", "Priority support"],
      storeOrder: 2,
      visibility: true,
      recommendedStatus: false,
    },
  },

  PLUS: {
    meta: {
      id: "PLUS",
      label: "Plus",
      description: "For growing teams and creators",
      color: "purple",
      gradient: "from-purple-500/10 to-zinc-900",
      icon: Gem,
      iconName: "Gem",
      priority: 3,
      badge: null,
      visibility: true,
      displayOrder: 3,
      recommendedTag: true,
      popularTag: false,
      bestValueTag: false,
    },
    highlights: [
      "Everything in BASIC, plus:",
      "Team management tools",
      "Basic analytics dashboard",
      "Priority messaging queue",
      "HD media processing",
      "Growing team features",
    ],
    featuresByCategory: {
      Messaging: ["Up to 1,000 messages/day", "Message history", "Priority messaging"],
      Storage: ["10 GB file storage", "Enhanced uploads (25 MB)"],
      Media: ["Standard media processing", "HD resolution"],
      Administration: ["Basic analytics dashboard", "Team management", "Single user management"],
      Support: ["Email support", "48hr response"],
      Security: ["Standard encryption", "Basic access control"],
    },
    pricing: calcPricing(15),
    store: {
      title: "Plus",
      subtitle: "For growing teams",
      marketingText: "Unlock team management tools and HD media processing for your growing crew.",
      cardGradient: "from-purple-500/5 to-zinc-900",
      cardColor: "purple",
      iconName: "Gem",
      comparisonFeatures: ["Team management", "HD media processing", "Basic analytics"],
      benefits: ["Team tools", "HD processing", "Growing features"],
      storeOrder: 3,
      visibility: true,
      recommendedStatus: true,
    },
  },

  PRO: {
    meta: {
      id: "PRO",
      label: "Pro",
      description: "Professional toolkit for power users",
      color: "cyan",
      gradient: "from-cyan-500/10 to-zinc-900",
      icon: Rocket,
      iconName: "Rocket",
      priority: 4,
      badge: null,
      visibility: true,
      displayOrder: 4,
      recommendedTag: false,
      popularTag: true,
      bestValueTag: false,
    },
    highlights: [
      "Everything in PLUS, plus:",
      "Advanced analytics & reporting",
      "Custom branding support",
      "Batch media operations",
      "Faster uploads & downloads",
      "Priority chat & email support",
      "Full audit trail access",
    ],
    featuresByCategory: {
      Messaging: ["Up to 10,000 messages/day", "Extended message history", "Priority messaging"],
      Storage: ["50 GB file storage", "Enhanced uploads (50 MB)", "Faster downloads"],
      Media: ["Advanced media processing", "HD resolution", "Batch media ops"],
      Administration: ["Advanced analytics dashboard", "Team management", "Custom branding"],
      Support: ["Priority email support", "12hr response", "Chat support"],
      Security: ["Enhanced encryption", "Advanced access control", "Audit logs"],
      "Business Tools": ["Basic API access"],
    },
    pricing: calcPricing(29),
    store: {
      title: "Pro",
      subtitle: "Professional toolkit",
      marketingText: "Advanced analytics, custom branding, batch operations — built for power users.",
      cardGradient: "from-cyan-500/5 to-zinc-900",
      cardColor: "cyan",
      iconName: "Rocket",
      comparisonFeatures: ["Advanced analytics", "Custom branding", "Batch operations", "Priority support"],
      benefits: ["Power user tools", "Advanced analytics", "Priority support"],
      storeOrder: 4,
      visibility: true,
      recommendedStatus: true,
    },
  },

  BUSINESS: {
    meta: {
      id: "BUSINESS",
      label: "Business",
      description: "Enterprise-ready for organizations",
      color: "orange",
      gradient: "from-orange-500/10 to-zinc-900",
      icon: Building,
      iconName: "Building",
      priority: 5,
      badge: null,
      visibility: true,
      displayOrder: 5,
      recommendedTag: false,
      popularTag: false,
      bestValueTag: true,
    },
    highlights: [
      "Everything in PRO, plus:",
      "Organization management",
      "Bulk operations at scale",
      "Dedicated support team",
      "99.9% SLA uptime guarantee",
      "SSO/SAML & compliance",
      "Full API & webhook access",
      "Up to 25 devices & team licenses",
    ],
    featuresByCategory: {
      Messaging: ["Unlimited messages", "Full message history", "Priority messaging", "Bulk messaging"],
      Storage: ["250 GB file storage", "Business uploads (200 MB)", "CDN delivery"],
      Media: ["Premium media processing", "4K resolution", "Bulk media operations"],
      Administration: ["Premium analytics & reports", "Organization management", "Bulk operations", "Custom integrations"],
      Support: ["Dedicated support", "4hr response", "Phone & chat", "SLA: 99.9%"],
      Security: ["Enterprise encryption", "Advanced audit logs", "Compliance reporting", "SSO/SAML"],
      "Business Tools": ["Full API access", "Webhooks", "Custom integrations"],
      "Licensing Benefits": ["Up to 25 devices", "Team licenses", "Multi-org support"],
    },
    pricing: calcPricing(99),
    store: {
      title: "Business",
      subtitle: "Enterprise-ready",
      marketingText: "Full API access, SSO/SAML, dedicated support, and organization management at scale.",
      cardGradient: "from-orange-500/5 to-zinc-900",
      cardColor: "orange",
      iconName: "Building",
      comparisonFeatures: ["Unlimited messaging", "250 GB CDN storage", "SSO/SAML", "Dedicated support"],
      benefits: ["Org management", "Dedicated support", "99.9% SLA", "SSO/SAML"],
      storeOrder: 5,
      visibility: true,
      recommendedStatus: true,
    },
  },

  ENTERPRISE: {
    meta: {
      id: "ENTERPRISE",
      label: "Enterprise",
      description: "Maximum power and scale",
      color: "red",
      gradient: "from-red-500/10 to-zinc-900",
      icon: Crown,
      iconName: "Crown",
      priority: 6,
      badge: null,
      visibility: true,
      displayOrder: 6,
      recommendedTag: false,
      popularTag: false,
      bestValueTag: false,
    },
    highlights: [
      "Everything in BUSINESS, plus:",
      "Unlimited team & device scale",
      "24/7 dedicated account manager",
      "1-hour response SLA (99.99%)",
      "White-label branding",
      "AI-powered media processing",
      "Custom development pipeline",
      "Global CDN & custom retention",
    ],
    featuresByCategory: {
      Messaging: ["Unlimited everything", "Real-time messaging", "Priority routing", "Custom integrations"],
      Storage: ["Unlimited storage", "Unlimited uploads", "Global CDN", "Custom retention"],
      Media: ["Enterprise media suite", "8K + HDR", "AI-powered processing", "Custom pipelines"],
      Administration: ["Enterprise analytics suite", "Unlimited team scale", "White-label branding", "Priority feature access", "Custom development"],
      Support: ["24/7 dedicated support", "1hr response", "Dedicated account manager", "SLA: 99.99%"],
      Security: ["Maximum encryption", "Comprehensive audit logs", "Compliance reporting", "Dedicated security", "Custom policies"],
      "Business Tools": ["Full API access", "Advanced webhooks", "Custom integrations", "Dedicated infrastructure"],
      "Licensing Benefits": ["Unlimited devices", "Unlimited team scale", "Global licensing", "Priority allocations"],
    },
    pricing: calcPricing(299),
    store: {
      title: "Enterprise",
      subtitle: "Maximum power",
      marketingText: "Unlimited everything, 24/7 dedicated support, white-label branding, and custom development.",
      cardGradient: "from-red-500/5 to-zinc-900",
      cardColor: "red",
      iconName: "Crown",
      comparisonFeatures: ["Unlimited everything", "24/7 dedicated AM", "White-label", "Custom development"],
      benefits: ["Maximum scale", "24/7 support", "Custom development", "White-label"],
      storeOrder: 6,
      visibility: true,
      recommendedStatus: false,
    },
  },

  EXTREME: {
    meta: {
      id: "EXTREME",
      label: "Extreme",
      description: "Ultra-premium for the elite",
      color: "pink",
      gradient: "from-pink-500/10 to-zinc-900",
      icon: Flame,
      iconName: "Flame",
      priority: 7,
      badge: "Elite",
      visibility: true,
      displayOrder: 7,
      recommendedTag: false,
      popularTag: false,
      bestValueTag: false,
    },
    highlights: [
      "Everything in ENTERPRISE, plus:",
      "Priority infrastructure allocation",
      "Concierge onboarding & migration",
      "Custom feature development SLA",
      "Direct engineering access",
      "Early access to all new features",
      "Executive sponsorship & reviews",
    ],
    featuresByCategory: {
      Messaging: ["Unlimited everything", "Real-time priority routing", "Custom integration pipeline", "Private messaging channels"],
      Storage: ["Unlimited storage", "Custom retention policies", "Global edge CDN", "Dedicated storage clusters"],
      Media: ["Enterprise media suite", "8K + HDR + immersive", "AI-powered processing", "Custom development pipeline"],
      Administration: ["Enterprise analytics suite", "Unlimited team scale", "White-label branding", "Priority feature access", "Dedicated development sprints", "Executive business reviews"],
      Support: ["Concierge support", "30min response", "Dedicated account team", "SLA: 99.995%", "Direct engineering access"],
      Security: ["Maximum encryption", "Comprehensive audit logs", "Custom security policies", "Dedicated security team", "Penetration testing included"],
      "Business Tools": ["Full API access", "Custom webhook infrastructure", "Dedicated infrastructure", "Custom integrations SLA"],
      "Licensing Benefits": ["Unlimited devices & teams", "Global licensing", "Priority allocations", "Custom license terms"],
    },
    pricing: calcPricing(499),
    store: {
      title: "Extreme",
      subtitle: "Elite Tier",
      marketingText: "The extreme tier — priority infrastructure, concierge support, and direct engineering access.",
      cardGradient: "from-pink-500/5 to-zinc-900",
      cardColor: "pink",
      iconName: "Flame",
      comparisonFeatures: ["Priority infrastructure", "Concierge support", "Direct engineering", "Executive reviews"],
      benefits: ["Elite infrastructure", "Concierge onboarding", "Direct engineering", "Executive sponsorship"],
      storeOrder: 7,
      visibility: true,
      recommendedStatus: false,
    },
  },

  SP_PLAN: {
    meta: {
      id: "SP_PLAN",
      label: "SP\u2019s Plan",
      description: "Exclusive flagship founder tier",
      color: "gold",
      gradient: "from-yellow-500/10 via-amber-500/10 to-zinc-900",
      icon: Star,
      iconName: "Star",
      priority: 8,
      badge: "Founder Edition",
      visibility: true,
      displayOrder: 8,
      recommendedTag: false,
      popularTag: false,
      bestValueTag: false,
    },
    highlights: [
      "Everything in EXTREME, plus:",
      "Priority infrastructure allocation",
      "Concierge onboarding & migration",
      "Custom feature development SLA",
      "Direct engineering access",
      "Early access to all new features",
      "Executive sponsorship & reviews",
    ],
    featuresByCategory: {
      Messaging: ["Unlimited everything", "Real-time priority routing", "Custom integration pipeline", "Private messaging channels"],
      Storage: ["Unlimited storage", "Custom retention policies", "Global edge CDN", "Dedicated storage clusters"],
      Media: ["Enterprise media suite", "8K + HDR + immersive", "AI-powered processing", "Custom development pipeline"],
      Administration: ["Enterprise analytics suite", "Unlimited team scale", "White-label branding", "Priority feature access", "Dedicated development sprints", "Executive business reviews"],
      Support: ["Concierge support", "15min response", "Dedicated account team", "SLA: 99.995%", "Direct engineering access"],
      Security: ["Maximum encryption", "Comprehensive audit logs", "Custom security policies", "Dedicated security team", "Penetration testing included"],
      "Business Tools": ["Full API access", "Custom webhook infrastructure", "Dedicated infrastructure", "Custom integrations SLA"],
      "Licensing Benefits": ["Unlimited devices & teams", "Global licensing", "Priority allocations", "Custom license terms"],
    },
    pricing: calcPricing(999),
    store: {
      title: "SP\u2019s Plan",
      subtitle: "Founder Edition",
      marketingText: "The ultimate Founder Edition — exclusive access, direct engineering, and VIP treatment.",
      cardGradient: "from-yellow-500/10 via-amber-500/10 to-zinc-900",
      cardColor: "gold",
      iconName: "Star",
      comparisonFeatures: ["Founder Edition badge", "15min response SLA", "Direct engineering", "Executive sponsorship"],
      benefits: ["Founder Edition", "VIP treatment", "Direct engineering", "Executive reviews"],
      storeOrder: 8,
      visibility: true,
      recommendedStatus: true,
    },
  },
};

export function getPlanById(id: string): PlanDefinition | undefined {
  return PREMIUM_PLANS[id as PlanId];
}

export function getPlanList(): PlanDefinition[] {
  return ALL_PLAN_IDS.map((id) => PREMIUM_PLANS[id]);
}

export function getPlanPricing(planId: string): PriceBreakdown {
  const plan = getPlanById(planId);
  return plan?.pricing ?? calcPricing(0);
}

export function getDailyPrice(planId: string): number {
  return getPlanPricing(planId).daily;
}

export function getWeeklyPrice(planId: string): number {
  return getPlanPricing(planId).weekly;
}

export function getMonthlyPrice(planId: string): number {
  return getPlanPricing(planId).monthly;
}

export function getYearlyPrice(planId: string): number {
  return getPlanPricing(planId).yearly;
}

export function getLifetimePrice(planId: string): number {
  return getPlanPricing(planId).lifetime;
}

export const PLAN_COLORS: Record<string, string> = {
  gray: "text-gray-400",
  blue: "text-blue-400",
  indigo: "text-indigo-400",
  purple: "text-purple-400",
  cyan: "text-cyan-400",
  orange: "text-orange-400",
  red: "text-red-400",
  pink: "text-pink-400",
  gold: "text-yellow-400",
};

export const PLAN_GRADIENTS: Record<string, string> = {
  gray: "from-gray-500/10 to-zinc-900",
  blue: "from-blue-500/10 to-zinc-900",
  indigo: "from-indigo-500/10 to-zinc-900",
  purple: "from-purple-500/10 to-zinc-900",
  cyan: "from-cyan-500/10 to-zinc-900",
  orange: "from-orange-500/10 to-zinc-900",
  red: "from-red-500/10 to-zinc-900",
  pink: "from-pink-500/10 to-zinc-900",
  gold: "from-yellow-500/10 via-amber-500/10 to-zinc-900",
};

export interface PlanColorSet {
  text: string;
  border: string;
  bg: string;
  badge: string;
  glow: string;
  fromBg: string;
  cardGradient: string;
  hoverBorder: string;
  hoverBg: string;
  btnBg: string;
  btnHoverBg: string;
  btnText: string;
  tierText: string;
  badgeGradient: string;
  compareBorder: string;
  compareBg: string;
}

const GRAY: PlanColorSet = {
  text: "text-gray-400", border: "border-gray-500/20", bg: "bg-gray-500/10",
  badge: "bg-gray-500/20 text-gray-300", glow: "", fromBg: "from-gray-500/5",
  cardGradient: "", hoverBorder: "hover:border-zinc-700", hoverBg: "hover:bg-zinc-800/80",
  btnBg: "bg-zinc-800", btnHoverBg: "hover:bg-zinc-700", btnText: "text-zinc-200",
  tierText: "text-zinc-600", badgeGradient: "",
  compareBorder: "border-gray-500/20", compareBg: "bg-gray-500/10",
};
const BLUE: PlanColorSet = {
  text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10",
  badge: "bg-blue-500/20 text-blue-300", glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]", fromBg: "from-blue-500/5",
  cardGradient: "", hoverBorder: "hover:border-zinc-700", hoverBg: "hover:bg-zinc-800/80",
  btnBg: "bg-zinc-800", btnHoverBg: "hover:bg-zinc-700", btnText: "text-zinc-200",
  tierText: "text-zinc-600", badgeGradient: "",
  compareBorder: "border-blue-500/20", compareBg: "bg-blue-500/10",
};
const INDIGO: PlanColorSet = {
  text: "text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-500/10",
  badge: "bg-indigo-500/20 text-indigo-300", glow: "shadow-[0_0_20px_rgba(99,102,241,0.15)]", fromBg: "from-indigo-500/5",
  cardGradient: "", hoverBorder: "hover:border-zinc-700", hoverBg: "hover:bg-zinc-800/80",
  btnBg: "bg-zinc-800", btnHoverBg: "hover:bg-zinc-700", btnText: "text-zinc-200",
  tierText: "text-zinc-600", badgeGradient: "",
  compareBorder: "border-indigo-500/20", compareBg: "bg-indigo-500/10",
};
const PURPLE: PlanColorSet = {
  text: "text-purple-400", border: "border-purple-500/20", bg: "bg-purple-500/10",
  badge: "bg-purple-500/20 text-purple-300", glow: "shadow-[0_0_20px_rgba(168,85,247,0.15)]", fromBg: "from-purple-500/5",
  cardGradient: "", hoverBorder: "hover:border-zinc-700", hoverBg: "hover:bg-zinc-800/80",
  btnBg: "bg-zinc-800", btnHoverBg: "hover:bg-zinc-700", btnText: "text-zinc-200",
  tierText: "text-zinc-600", badgeGradient: "",
  compareBorder: "border-purple-500/20", compareBg: "bg-purple-500/10",
};
const CYAN: PlanColorSet = {
  text: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/10",
  badge: "bg-cyan-500/20 text-cyan-300", glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]", fromBg: "from-cyan-500/5",
  cardGradient: "", hoverBorder: "hover:border-zinc-700", hoverBg: "hover:bg-zinc-800/80",
  btnBg: "bg-zinc-800", btnHoverBg: "hover:bg-zinc-700", btnText: "text-zinc-200",
  tierText: "text-zinc-600", badgeGradient: "",
  compareBorder: "border-cyan-500/20", compareBg: "bg-cyan-500/10",
};
const ORANGE: PlanColorSet = {
  text: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/10",
  badge: "bg-orange-500/20 text-orange-300", glow: "shadow-[0_0_20px_rgba(249,115,22,0.15)]", fromBg: "from-orange-500/5",
  cardGradient: "", hoverBorder: "hover:border-zinc-700", hoverBg: "hover:bg-zinc-800/80",
  btnBg: "bg-zinc-800", btnHoverBg: "hover:bg-zinc-700", btnText: "text-zinc-200",
  tierText: "text-zinc-600", badgeGradient: "",
  compareBorder: "border-orange-500/20", compareBg: "bg-orange-500/10",
};
const RED: PlanColorSet = {
  text: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10",
  badge: "bg-red-500/20 text-red-300", glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]", fromBg: "from-red-500/5",
  cardGradient: "", hoverBorder: "hover:border-zinc-700", hoverBg: "hover:bg-zinc-800/80",
  btnBg: "bg-zinc-800", btnHoverBg: "hover:bg-zinc-700", btnText: "text-zinc-200",
  tierText: "text-zinc-600", badgeGradient: "",
  compareBorder: "border-red-500/20", compareBg: "bg-red-500/10",
};
const PINK: PlanColorSet = {
  text: "text-pink-400", border: "border-pink-500/20", bg: "bg-pink-500/10",
  badge: "bg-pink-500/20 text-pink-300", glow: "shadow-[0_0_20px_rgba(236,72,153,0.25)]", fromBg: "from-pink-500/5",
  cardGradient: "from-pink-950/20 to-zinc-900", hoverBorder: "hover:border-pink-400/60", hoverBg: "",
  btnBg: "bg-pink-600", btnHoverBg: "hover:bg-pink-500", btnText: "text-white",
  tierText: "text-pink-600", badgeGradient: "from-pink-500 to-rose-600",
  compareBorder: "border-pink-500/40", compareBg: "bg-pink-950/20",
};
const GOLD: PlanColorSet = {
  text: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10",
  badge: "bg-yellow-500/20 text-yellow-300", glow: "shadow-[0_0_25px_rgba(234,179,8,0.2)]", fromBg: "from-yellow-500/10",
  cardGradient: "from-yellow-950/20 to-zinc-900", hoverBorder: "hover:border-yellow-400/60", hoverBg: "",
  btnBg: "bg-yellow-600", btnHoverBg: "hover:bg-yellow-500", btnText: "text-white",
  tierText: "text-yellow-600", badgeGradient: "from-yellow-500 to-amber-600",
  compareBorder: "border-yellow-500/40", compareBg: "bg-yellow-950/20",
};

export const PLAN_CSS_COLORS: Record<string, PlanColorSet> = {
  gray: GRAY, blue: BLUE, indigo: INDIGO, purple: PURPLE, cyan: CYAN,
  orange: ORANGE, red: RED, pink: PINK, gold: GOLD,
};

export const PLAN_SELECT_COLORS: Record<string, string> = {
  gray: "border-gray-500/50 bg-gray-500/10 shadow-gray-500/10",
  blue: "border-blue-500/50 bg-blue-500/10 shadow-blue-500/10",
  indigo: "border-indigo-500/50 bg-indigo-500/10 shadow-indigo-500/10",
  purple: "border-purple-500/50 bg-purple-500/10 shadow-purple-500/10",
  cyan: "border-cyan-500/50 bg-cyan-500/10 shadow-cyan-500/10",
  orange: "border-orange-500/50 bg-orange-500/10 shadow-orange-500/10",
  red: "border-red-500/50 bg-red-500/10 shadow-red-500/10",
  pink: "border-pink-500/50 bg-pink-500/10 shadow-pink-500/10",
  gold: "border-yellow-500/50 bg-yellow-500/10 shadow-yellow-500/10",
};

export const PLAN_BORDER_COLORS: Record<string, string> = {
  gray: "border-gray-500/30 bg-gray-500/5 ring-gray-500/10",
  blue: "border-blue-500/30 bg-blue-500/5 ring-blue-500/10",
  indigo: "border-indigo-500/30 bg-indigo-500/5 ring-indigo-500/10",
  purple: "border-purple-500/30 bg-purple-500/5 ring-purple-500/10",
  cyan: "border-cyan-500/30 bg-cyan-500/5 ring-cyan-500/10",
  orange: "border-orange-500/30 bg-orange-500/5 ring-orange-500/10",
  red: "border-red-500/30 bg-red-500/5 ring-red-500/10",
  pink: "border-pink-500/30 bg-pink-500/5 ring-pink-500/10",
  gold: "border-yellow-500/30 bg-yellow-500/5 ring-yellow-500/10",
};

export function getAllComparisonFeatures(): string[] {
  const allFeatures = new Set<string>();
  for (const planId of ALL_PLAN_IDS) {
    const plan = PREMIUM_PLANS[planId];
    for (const features of Object.values(plan.featuresByCategory)) {
      for (const f of features) {
        allFeatures.add(f);
      }
    }
  }
  return Array.from(allFeatures);
}

export function getFeatureList(planId: string): string[] {
  const plan = getPlanById(planId);
  if (!plan) return [];
  return Object.values(plan.featuresByCategory).flat();
}

export function getFeatureCategories(planId: string): string[] {
  const plan = getPlanById(planId);
  if (!plan) return [];
  return Object.keys(plan.featuresByCategory);
}

export function getPlanIndex(planId: string): number {
  return ALL_PLAN_IDS.indexOf(planId as PlanId);
}

export function getNextPlan(planId: string): string | null {
  const i = getPlanIndex(planId);
  return i >= 0 && i < ALL_PLAN_IDS.length - 1 ? ALL_PLAN_IDS[i + 1] : null;
}

export function getPrevPlan(planId: string): string | null {
  const i = getPlanIndex(planId);
  return i > 0 ? ALL_PLAN_IDS[i - 1] : null;
}

export function getPlanComparison(from: string, to: string): {
  added: string[];
  removed: string[];
  common: string[];
} {
  const fromFeatures = new Set(getFeatureList(from));
  const toFeatures = new Set(getFeatureList(to));
  const added = [...toFeatures].filter((f) => !fromFeatures.has(f));
  const removed = [...fromFeatures].filter((f) => !toFeatures.has(f));
  const common = [...fromFeatures].filter((f) => toFeatures.has(f));
  return { added, removed, common };
}

export function getPlanUpgradePath(planId: string): {
  current: string;
  next: string | null;
  gained: string[];
} | null {
  const next = getNextPlan(planId);
  if (!next) return null;
  const comparison = getPlanComparison(planId, next);
  return { current: planId, next, gained: comparison.added };
}

export const SUBSCRIPTION_TYPE_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  LIFETIME: "Lifetime",
  CUSTOM: "Custom",
};

export const DURATION_DAYS: Record<string, number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  YEARLY: 365,
};

export function getDurationDays(type: string, customValue?: number, customUnit?: string): number {
  if (type === "CUSTOM" && customValue && customUnit) {
    switch (customUnit) {
      case "DAYS": return customValue;
      case "WEEKS": return customValue * 7;
      case "MONTHS": return customValue * 30;
      case "YEARS": return customValue * 365;
      default: return customValue;
    }
  }
  return DURATION_DAYS[type] || 30;
}

export interface PlanConfigExport {
  version: string;
  plans: Array<{
    id: PlanId;
    meta: Omit<PlanMetaConfig, "icon">;
    iconName: string;
    highlights: string[];
    featuresByCategory: Record<string, string[]>;
    pricing: PriceBreakdown;
    store: {
      title: string;
      subtitle: string;
      marketingText: string;
      cardColor: string;
      iconName: string;
      comparisonFeatures: string[];
      benefits: string[];
      storeOrder: number;
      visibility: boolean;
      recommendedStatus: boolean;
    };
  }>;
  subscriptionTypes: {
    user: readonly string[];
    admin: readonly string[];
  };
  priceEngine: {
    lifetimeMultiplier: number;
    daysInMonth: number;
    monthsInYear: number;
    daysInWeek: number;
    daysInYear: number;
    currency: string;
  };
}

export function exportPlanConfig(): PlanConfigExport {
  return {
    version: "2.0.0",
    plans: ALL_PLAN_IDS.map((id) => {
      const plan = PREMIUM_PLANS[id];
      const { icon: _icon, ...metaWithoutIcon } = plan.meta;
      return {
        id,
        meta: metaWithoutIcon,
        iconName: plan.meta.iconName,
        highlights: plan.highlights,
        featuresByCategory: plan.featuresByCategory,
        pricing: plan.pricing,
        store: {
          title: plan.store.title,
          subtitle: plan.store.subtitle,
          marketingText: plan.store.marketingText,
          cardColor: plan.store.cardColor,
          iconName: plan.store.iconName,
          comparisonFeatures: plan.store.comparisonFeatures,
          benefits: plan.store.benefits,
          storeOrder: plan.store.storeOrder,
          visibility: plan.store.visibility,
          recommendedStatus: plan.store.recommendedStatus,
        },
      };
    }),
    subscriptionTypes: {
      user: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
      admin: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "LIFETIME", "CUSTOM"],
    },
    priceEngine: {
      lifetimeMultiplier: LIFETIME_FACTOR,
      daysInMonth: 30,
      monthsInYear: 12,
      daysInWeek: 7,
      daysInYear: 365,
      currency: "$",
    },
  };
}
