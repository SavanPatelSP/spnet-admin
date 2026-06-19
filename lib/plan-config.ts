import { COIN_PACKAGES, GEM_PACKAGES, LICENSE_TIERS } from "./constants";

export const COIN_LABELS = COIN_PACKAGES.map((p) => p.label);
export const GEM_LABELS = GEM_PACKAGES.map((p) => p.label);
export const LICENSE_LABELS = LICENSE_TIERS.map((t) => t.label);

export const COIN_FEATURES_BY_CATEGORY: Record<string, Record<string, string[]>> = {
  Starter: {
    "Platform Access": ["Basic economy participation", "Standard wallet features", "Community marketplace access"],
    "Engagement": ["Entry-level rewards", "Basic tipping", "Limited promotional tools"],
    "Support": ["Community support", "Standard response times"],
  },
  Growth: {
    "Platform Access": ["All Starter access", "Enhanced wallet limits", "Priority marketplace listings"],
    "Engagement": ["Standard rewards", "Tipping & transfers", "Campaign participation", "Better value per coin"],
    "Support": ["Email support", "Faster response times"],
  },
  Pro: {
    "Platform Access": ["All Growth access", "Professional wallet features", "Advanced marketplace tools"],
    "Engagement": ["Premium rewards", "Bulk tipping", "Campaign creation", "Best mid-range value"],
    "Support": ["Priority email support", "Dedicated account guidance"],
  },
  Enterprise: {
    "Platform Access": ["All Pro access", "Enterprise wallet limits", "White-glove onboarding"],
    "Engagement": ["Maximum rewards", "Unlimited tipping", "Enterprise campaigns", "Highest efficiency"],
    "Support": ["Dedicated support team", "SLA-backed response"],
  },
};

export const GEM_FEATURES_BY_CATEGORY: Record<string, Record<string, string[]>> = {
  Starter: {
    "Reward Power": ["Basic gem rewards", "Entry-level recognition"],
    "Purchasing Power": ["Limited premium access"],
    "Engagement": ["Quick engagement boosts", "Basic loyalty perks"],
  },
  Growth: {
    "Reward Power": ["Standard gem rewards", "Enhanced recognition badges"],
    "Purchasing Power": ["License purchasing power unlocked", "Select premium eligibility"],
    "Engagement": ["Loyalty program access", "Better value per gem"],
  },
  Pro: {
    "Reward Power": ["Premium reward capacity", "Exclusive recognition tiers"],
    "Purchasing Power": ["Premium subscription eligibility", "Full license purchasing power"],
    "Engagement": ["Professional-grade operations", "Campaign priority"],
  },
  Enterprise: {
    "Reward Power": ["Maximum gem capacity", "Executive recognition program"],
    "Purchasing Power": ["Full premium & license purchasing power", "Enterprise grant capabilities"],
    "Engagement": ["Enterprise-scale rewards", "Highest overall efficiency"],
  },
};

export const LICENSE_FEATURES_BY_CATEGORY: Record<string, Record<string, string[]>> = {
  "Starter License": {
    "Core Features": ["Basic feature access", "Standard encryption", "Community support"],
    "Scale": ["Single organization only", "Up to 3 devices"],
    "Usage": ["Up to 100 API calls/day", "1 GB storage"],
    "Licensing": ["180-day duration", "Non-renewable"],
  },
  "Professional License": {
    "Core Features": ["Full feature access", "Enhanced encryption", "Priority email support"],
    "Scale": ["Single organization", "Up to 10 devices"],
    "Usage": ["Up to 1,000 API calls/day", "10 GB storage"],
    "Licensing": ["365-day duration", "Renewable annually"],
  },
  "Business License": {
    "Core Features": ["All Professional features", "Advanced encryption", "Dedicated support", "Bulk operations", "SSO/SAML"],
    "Scale": ["Multi-organization support (up to 5 orgs)", "Up to 25 devices"],
    "Usage": ["Up to 10,000 API calls/day", "50 GB storage"],
    "Licensing": ["365-day duration", "Auto-renewable with discounts"],
  },
  "Enterprise License": {
    "Core Features": ["All Business features", "Enterprise encryption", "24/7 dedicated support", "Custom integrations", "Compliance reporting", "Audit logs"],
    "Scale": ["Unlimited organizations", "Up to 100 devices"],
    "Usage": ["Unlimited API calls", "Unlimited storage"],
    "Licensing": ["365-day duration", "Auto-renewable, custom terms available"],
  },
  "Ultimate License": {
    "Core Features": ["All Enterprise features", "Maximum encryption", "Concierge support", "Custom development pipeline", "Priority infrastructure", "Executive reviews", "White-label branding"],
    "Scale": ["Unlimited organizations with custom terms", "Unlimited devices"],
    "Usage": ["Unlimited everything — no rate limits"],
    "Licensing": ["365-day duration", "Auto-renewable, custom terms and SLA"],
  },
};

export function getCoinCategories(label: string): string[] {
  const cats = COIN_FEATURES_BY_CATEGORY[label];
  return cats ? Object.keys(cats) : [];
}

export function getGemCategories(label: string): string[] {
  const cats = GEM_FEATURES_BY_CATEGORY[label];
  return cats ? Object.keys(cats) : [];
}

export function getLicenseCategories(label: string): string[] {
  const cats = LICENSE_FEATURES_BY_CATEGORY[label];
  return cats ? Object.keys(cats) : [];
}

export function getCoinFeatureList(label: string): string[] {
  const cats = COIN_FEATURES_BY_CATEGORY[label];
  return cats ? Object.values(cats).flat() : [];
}

export function getGemFeatureList(label: string): string[] {
  const cats = GEM_FEATURES_BY_CATEGORY[label];
  return cats ? Object.values(cats).flat() : [];
}

export function getLicenseFeatureList(label: string): string[] {
  const cats = LICENSE_FEATURES_BY_CATEGORY[label];
  return cats ? Object.values(cats).flat() : [];
}

export function getCoinComparison(from: string, to: string) {
  const fromFeatures = new Set(getCoinFeatureList(from));
  const toFeatures = new Set(getCoinFeatureList(to));
  return {
    added: [...toFeatures].filter((f) => !fromFeatures.has(f)),
    removed: [...fromFeatures].filter((f) => !toFeatures.has(f)),
    common: [...fromFeatures].filter((f) => toFeatures.has(f)),
  };
}

export function getGemComparison(from: string, to: string) {
  const fromFeatures = new Set(getGemFeatureList(from));
  const toFeatures = new Set(getGemFeatureList(to));
  return {
    added: [...toFeatures].filter((f) => !fromFeatures.has(f)),
    removed: [...fromFeatures].filter((f) => !toFeatures.has(f)),
    common: [...fromFeatures].filter((f) => toFeatures.has(f)),
  };
}

export function getLicenseComparison(from: string, to: string) {
  const fromFeatures = new Set(getLicenseFeatureList(from));
  const toFeatures = new Set(getLicenseFeatureList(to));
  return {
    added: [...toFeatures].filter((f) => !fromFeatures.has(f)),
    removed: [...fromFeatures].filter((f) => !toFeatures.has(f)),
    common: [...fromFeatures].filter((f) => toFeatures.has(f)),
  };
}
