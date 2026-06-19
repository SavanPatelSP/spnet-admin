export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SP NET GRAM";
export const APP_DESCRIPTION = "Admin Panel";

export const LICENSE_KEY_PREFIX = process.env.LICENSE_KEY_PREFIX || "SPNET";

export const PLANS = ["FREE", "BASIC", "STUDENT", "PLUS", "PRO", "BUSINESS", "ENTERPRISE", "SP_PLAN"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_TIERS = ["FREE", "BASIC", "STUDENT", "PLUS", "PRO", "BUSINESS", "ENTERPRISE", "SP_PLAN"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PREMIUM_PLANS = ["PLUS", "PRO", "BUSINESS", "ENTERPRISE", "SP_PLAN"] as const;
export type PremiumPlan = (typeof PREMIUM_PLANS)[number];

export const SUBSCRIPTION_TYPES = ["MONTHLY", "YEARLY", "CUSTOM", "LIFETIME"] as const;
export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];

export const PREMIUM_ACTIONS = ["GRANTED", "EXTENDED", "PLAN_CHANGED", "REVOKED", "CANCELLED", "RENEWED", "DOWNGRADED", "UPGRADED", "CONVERTED_TO_LIFETIME", "CONVERTED_TO_CUSTOM"] as const;
export type PremiumAction = (typeof PREMIUM_ACTIONS)[number];

export const PREMIUM_REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"] as const;
export type PremiumRequestStatus = (typeof PREMIUM_REQUEST_STATUSES)[number];

export const LICENSE_STATUSES = ["ACTIVE", "SUSPENDED", "PENDING", "EXPIRED", "REVOKED"] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

export const DEFAULT_PLAN: Plan = (process.env.NEXT_PUBLIC_DEFAULT_PLAN as Plan) || "ENTERPRISE";
export const DEFAULT_MAX_DEVICES = Number(process.env.NEXT_PUBLIC_DEFAULT_MAX_DEVICES) || 10;
export const DEFAULT_EXPIRY_YEAR = Number(process.env.NEXT_PUBLIC_DEFAULT_EXPIRY_YEAR) || 2027;
export const EXPIRING_SOON_DAYS = Number(process.env.NEXT_PUBLIC_EXPIRING_SOON_DAYS) || 30;
export const AUDIT_RETENTION_DAYS = Number(process.env.NEXT_PUBLIC_AUDIT_RETENTION_DAYS) || 365;
export const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en-IN";

export const PLAN_PRICES: Record<string, number> = {
  FREE: 0, BASIC: 4, STUDENT: 6, PLUS: 9, PRO: 29, BUSINESS: 99, ENTERPRISE: 299, SP_PLAN: 599,
};

export interface CoinPackage {
  label: string;
  amount: number;
  price: number;
  currency: string;
  description?: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { label: "Starter", amount: 1000, price: 99, currency: "$", description: "Entry level" },
  { label: "Growth", amount: 5000, price: 399, currency: "$", description: "Standard package" },
  { label: "Pro", amount: 10000, price: 699, currency: "$", description: "Professional package" },
  { label: "Enterprise", amount: 50000, price: 2999, currency: "$", description: "Enterprise package" },
];

export interface GemPackage {
  label: string;
  amount: number;
  price: number;
  currency: string;
  description?: string;
}

export const GEM_PACKAGES: GemPackage[] = [
  { label: "Starter", amount: 10, price: 99, currency: "$", description: "Quick engagement" },
  { label: "Growth", amount: 50, price: 399, currency: "$", description: "Standard reward" },
  { label: "Pro", amount: 100, price: 699, currency: "$", description: "Premium reward" },
  { label: "Enterprise", amount: 500, price: 2999, currency: "$", description: "Enterprise grant" },
];

export interface LicenseTier {
  label: string;
  description: string;
  price: number;
  currency: string;
  maxDevices: number;
  durationDays: number;
  features: string[];
  benefits: string[];
  organizationCompatibility: string;
  usageInfo: string;
  expirationInfo: string;
}

export const LICENSE_TIERS: LicenseTier[] = [
  {
    label: "Starter License",
    description: "Entry-level license for small teams and individual use.",
    price: 9, currency: "$",
    maxDevices: 3, durationDays: 180,
    features: ["Basic feature access", "Standard encryption", "Community support", "Single organization"],
    benefits: ["Low-cost entry point", "Simple setup", "6-month duration", "Up to 3 devices"],
    organizationCompatibility: "Single organization only",
    usageInfo: "Up to 100 API calls/day, 1 GB storage",
    expirationInfo: "180 days from activation, non-renewable",
  },
  {
    label: "Professional License",
    description: "Professional-grade license for growing teams and businesses.",
    price: 29, currency: "$",
    maxDevices: 10, durationDays: 365,
    features: ["Full feature access", "Enhanced encryption", "Priority email support", "Single organization"],
    benefits: ["Professional toolkit", "Annual duration", "Up to 10 devices", "Priority support"],
    organizationCompatibility: "Single organization",
    usageInfo: "Up to 1,000 API calls/day, 10 GB storage",
    expirationInfo: "365 days from activation, renewable annually",
  },
  {
    label: "Business License",
    description: "Business-grade license with advanced features and multi-org support.",
    price: 99, currency: "$",
    maxDevices: 25, durationDays: 365,
    features: ["All Professional features", "Advanced encryption", "Dedicated support", "Multi-organization support", "Bulk operations", "SSO/SAML"],
    benefits: ["Business-grade security", "Multi-org management", "25 device limit", "Dedicated support team"],
    organizationCompatibility: "Multi-organization (up to 5 orgs)",
    usageInfo: "Up to 10,000 API calls/day, 50 GB storage",
    expirationInfo: "365 days from activation, auto-renewable with discounts",
  },
  {
    label: "Enterprise License",
    description: "Enterprise license for large organizations with custom requirements.",
    price: 299, currency: "$",
    maxDevices: 100, durationDays: 365,
    features: ["All Business features", "Enterprise encryption", "24/7 dedicated support", "Unlimited organizations", "Custom integrations", "Compliance reporting", "Audit logs"],
    benefits: ["Enterprise security suite", "Unlimited scalability", "100 device limit", "24/7 account management", "Custom development"],
    organizationCompatibility: "Unlimited organizations",
    usageInfo: "Unlimited API calls, Unlimited storage",
    expirationInfo: "365 days from activation, auto-renewable, custom terms available",
  },
  {
    label: "Ultimate License",
    description: "Maximum-tier license with unlimited everything and priority infrastructure.",
    price: 599, currency: "$",
    maxDevices: -1, durationDays: 365,
    features: ["All Enterprise features", "Maximum encryption", "Concierge support", "Unlimited organizations", "Custom development pipeline", "Priority infrastructure", "Executive reviews", "White-label branding"],
    benefits: ["Unlimited devices", "Unlimited organizations", "Priority infrastructure", "Direct engineering access", "Executive sponsorship"],
    organizationCompatibility: "Unlimited organizations with custom terms",
    usageInfo: "Unlimited everything — no rate limits",
    expirationInfo: "365 days from activation, auto-renewable, custom terms and SLA",
  },
];

export type CurrencyCode = "$" | "₹" | "€" | "£";
export const DEFAULT_CURRENCY: CurrencyCode = "$";

export function getCurrencySymbol(preferred?: CurrencyCode): CurrencyCode {
  return preferred || DEFAULT_CURRENCY;
}

export const ROLE_PRICES: Record<string, number> = {
  OWNER: 1000,
  SUPER_ADMIN: 500,
  ADMIN: 250,
  MANAGER: 250,
  SUPERVISOR: 150,
  MODERATOR: 100,
  SUPPORT: 50,
  VIEWER: 10,
};

export const SECURITY_POLICY_DAYS: Record<string, number> = {
  HIGH: Number(process.env.SECURITY_POLICY_HIGH_DAYS) || 7,
  STANDARD: Number(process.env.SECURITY_POLICY_STANDARD_DAYS) || 14,
  RELAXED: Number(process.env.SECURITY_POLICY_RELAXED_DAYS) || 30,
  CUSTOM: 0,
};

export const API_ROUTES = {
  DEVICES: {
    REVOKE: "/api/devices/revoke",
    LIST: "/api/devices/list",
    DETAIL: "/api/devices/detail",
    UPDATE_TRUST: "/api/devices/update-trust",
    BLACKLIST: "/api/devices/blacklist",
    WHITELIST: "/api/devices/whitelist",
    FINGERPRINT: "/api/devices/fingerprint",
    SESSION_ENFORCEMENT: "/api/devices/session-enforcement",
    ANALYTICS: "/api/devices/analytics",
    VALIDATE: "/api/devices/validate",
    EXPORT: "/api/devices/export",
    TRUST_INCREASE: "/api/devices/trust/increase",
    TRUST_DECREASE: "/api/devices/trust/decrease",
    TRUST_RESET: "/api/devices/trust/reset",
    TRUST_HISTORY: "/api/devices/trust/history",
    ENRICH_GEO: "/api/devices/enrich-geo",
    BATCH_ENRICH: "/api/devices/batch-enrich",
  },
  ACTIVATIONS: {
    DELETE: "/api/activations/delete",
  },
  LICENSES: {
    CREATE: "/api/licenses/create",
    UPDATE: "/api/licenses/update",
    DELETE: "/api/licenses/delete",
    LIST: "/api/licenses/list",
    TOGGLE_STATUS: "/api/licenses/toggle-status",
    REGENERATE_KEY: "/api/licenses/regenerate-key",
    EMERGENCY_MODE: "/api/licenses/emergency-mode",
    BULK_CREATE: "/api/licenses/bulk-create",
    TRANSFER: "/api/licenses/transfer",
    VALIDATE: "/api/licenses/validate",
    FEATURE_FLAGS: "/api/licenses/feature-flags",
    TAGS: "/api/licenses/tags",
    TEMPLATES: "/api/licenses/templates",
    EVENTS: "/api/licenses/events",
    TRIAL: "/api/licenses/trial",
    TRIAL_CONVERT: "/api/licenses/trial-convert",
    USAGE: "/api/licenses/usage",
  },
  ROLES: {
    CREATE: "/api/roles/create",
    LIST: "/api/roles/list",
    UPDATE: "/api/roles/update",
    UPDATE_PERMISSIONS: "/api/roles/update-permissions",
    DELETE: "/api/roles/delete",
  },
  SECURITY: {
    TOGGLE_POLICY: "/api/security/toggle-policy",
  },
  TEAM_MEMBERS: {
    CREATE: "/api/team-members/create",
    UPDATE: "/api/team-members/update",
    UPDATE_STATUS: "/api/team-members/update-status",
    CHANGE_ROLE: "/api/team-members/change-role",
    DELETE: "/api/team-members/delete",
    TRANSFER_OWNERSHIP: "/api/team-members/transfer-ownership",
    BULK_INVITE: "/api/team-members/bulk-invite",
    MFA_SETUP: "/api/team-members/mfa/setup",
    MFA_DISABLE: "/api/team-members/mfa/disable",
    MFA_LIST: "/api/team-members/mfa/list",
    SESSIONS_LIST: "/api/team-members/sessions/list",
    SESSIONS_REVOKE: "/api/team-members/sessions/revoke",
    LOGIN_HISTORY: "/api/team-members/login-history",
    LIFECYCLE: "/api/team-members/lifecycle",
  },
  PREMIUM: {
    GRANT: "/api/premium/grant",
    REVOKE: "/api/premium/revoke",
    EXTEND: "/api/premium/extend",
    CHANGE_PLAN: "/api/premium/change-plan",
    HISTORY: "/api/premium/history",
    BULK_GRANT: "/api/premium/bulk-grant",
    CONVERT_LIFETIME: "/api/premium/convert-lifetime",
    DOWNGRADE: "/api/premium/downgrade",
    REQUESTS: "/api/premium/requests",
    REQUEST: (id: string) => `/api/premium/requests/${id}`,
    REQUEST_APPROVE: (id: string) => `/api/premium/requests/${id}/approve`,
    REQUEST_REJECT: (id: string) => `/api/premium/requests/${id}/reject`,
    REQUEST_CONVERT: (id: string) => `/api/premium/requests/${id}/convert`,
    CONVERT_CUSTOM: "/api/premium/convert-custom",
  },
  COINS: {
    BALANCE: "/api/coins/balance",
    ADD: "/api/coins/add",
    REMOVE: "/api/coins/remove",
    REFUND: "/api/coins/refund",
    HISTORY: "/api/coins/history",
    BULK_ADD: "/api/coins/bulk-add",
    BULK_REMOVE: "/api/coins/bulk-remove",
    SET: "/api/coins/set",
    SET_INFINITE: "/api/coins/set-infinite",
    REMOVE_INFINITE: "/api/coins/remove-infinite",
    GRANT: "/api/coins/grant",
  },
  GEMS: {
    BALANCE: "/api/gems/balance",
    GRANT: "/api/gems/grant",
    REVOKE: "/api/gems/revoke",
    HISTORY: "/api/gems/history",
    REWARDS_LIST: "/api/gems/rewards/list",
    REWARDS_CREATE: "/api/gems/rewards/create",
    REWARDS_UPDATE: "/api/gems/rewards/update",
    REWARDS_DELETE: "/api/gems/rewards/delete",
    BULK_GRANT: "/api/gems/bulk-grant",
    BULK_REVOKE: "/api/gems/bulk-revoke",
    SET: "/api/gems/set",
    SET_INFINITE: "/api/gems/set-infinite",
    REMOVE_INFINITE: "/api/gems/remove-infinite",
  },
  CONTENT: {
    LIST: "/api/content/list",
    DETAIL: (id: string) => `/api/content/${id}`,
    PUBLISH: (id: string) => `/api/content/${id}/publish`,
    REVIEW: (id: string) => `/api/content/${id}/review`,
  },
  BROADCASTS: {
    LIST: "/api/broadcasts",
    CREATE: "/api/broadcasts",
    UPDATE: (id: string) => `/api/broadcasts/${id}`,
    DELETE: (id: string) => `/api/broadcasts/${id}`,
    SEND: (id: string) => `/api/broadcasts/${id}/send`,
    TARGETS: "/api/broadcast/targets",
  },
  SUPPORT: {
    LIST: "/api/support",
    CREATE: "/api/support",
    UPDATE: (id: string) => `/api/support/${id}`,
    DELETE: (id: string) => `/api/support/${id}`,
    ASSIGN: (id: string) => `/api/support/${id}/assign`,
    ADD_NOTE: (id: string) => `/api/support/${id}/notes`,
  },
  MODERATION: {
    REPORTS: "/api/moderation/reports",
    REPORT: (id: string) => `/api/moderation/reports/${id}`,
    RESOLVE_REPORT: (id: string) => `/api/moderation/reports/${id}/resolve`,
    ACTIONS: "/api/moderation/actions",
    ACTION: (id: string) => `/api/moderation/actions/${id}`,
  },
  AUDIT: {
    LIST: "/api/settings/audit/list",
  },
  SEARCH: "/api/search",
} as const;

export const AUDIT_ACTIONS = {
  LICENSE_CREATED: "LICENSE_CREATED",
  LICENSE_UPDATED: "LICENSE_UPDATED",
  LICENSE_DELETED: "LICENSE_DELETED",
  LICENSE_SUSPENDED: "LICENSE_SUSPENDED",
  LICENSE_REACTIVATED: "LICENSE_REACTIVATED",
  LICENSE_KEY_REGENERATED: "LICENSE_KEY_REGENERATED",
  DEVICE_REVOKED: "DEVICE_REVOKED",
  ACTIVATION_DELETED: "ACTIVATION_DELETED",
  ROLE_CREATED: "ROLE_CREATED",
  ROLE_UPDATED: "ROLE_UPDATED",
  ROLE_DELETED: "ROLE_DELETED",
  ROLE_PERMISSIONS_UPDATED: "ROLE_PERMISSIONS_UPDATED",
  TEAM_MEMBER_CREATED: "TEAM_MEMBER_CREATED",
  TEAM_MEMBER_UPDATED: "TEAM_MEMBER_UPDATED",
  TEAM_MEMBER_SUSPENDED: "TEAM_MEMBER_SUSPENDED",
  TEAM_MEMBER_REACTIVATED: "TEAM_MEMBER_REACTIVATED",
  TEAM_MEMBER_ROLE_CHANGED: "TEAM_MEMBER_ROLE_CHANGED",
  TEAM_MEMBER_DELETED: "TEAM_MEMBER_DELETED",
  POLICY_TOGGLED: "POLICY_TOGGLED",
  EMERGENCY_LOCKDOWN: "EMERGENCY_LOCKDOWN",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  INVALID_LICENSE_KEY: "INVALID_LICENSE_KEY",
  LICENSE_EXPIRED_DENIAL: "LICENSE_EXPIRED_DENIAL",
  LICENSE_SUSPENDED_DENIAL: "LICENSE_SUSPENDED_DENIAL",
  LOGOUT: "LOGOUT",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  PREMIUM_GRANTED: "PREMIUM_GRANTED",
  PREMIUM_REVOKED: "PREMIUM_REVOKED",
  PREMIUM_EXTENDED: "PREMIUM_EXTENDED",
  PREMIUM_PLAN_CHANGED: "PREMIUM_PLAN_CHANGED",
  PREMIUM_CANCELLED: "PREMIUM_CANCELLED",
  PREMIUM_LIFETIME_CONVERTED: "PREMIUM_LIFETIME_CONVERTED",
  PREMIUM_BULK_GRANTED: "PREMIUM_BULK_GRANTED",
  PREMIUM_DOWNGRADED: "PREMIUM_DOWNGRADED",
  PREMIUM_UPGRADED: "PREMIUM_UPGRADED",
  PREMIUM_CONVERTED_TO_CUSTOM: "PREMIUM_CONVERTED_TO_CUSTOM",
  PREMIUM_REQUEST_CREATED: "PREMIUM_REQUEST_CREATED",
  PREMIUM_REQUEST_APPROVED: "PREMIUM_REQUEST_APPROVED",
  PREMIUM_REQUEST_REJECTED: "PREMIUM_REQUEST_REJECTED",
  PREMIUM_REQUEST_MODIFIED: "PREMIUM_REQUEST_MODIFIED",
  PREMIUM_GRANTED_FROM_REQUEST: "PREMIUM_GRANTED_FROM_REQUEST",
  COINS_ADDED: "COINS_ADDED",
  COINS_REMOVED: "COINS_REMOVED",
  COINS_REFUNDED: "COINS_REFUNDED",
  COINS_ADJUSTED: "COINS_ADJUSTED",
  COINS_SET: "COINS_SET",
  COINS_INFINITE_SET: "COINS_INFINITE_SET",
  COINS_INFINITE_REMOVED: "COINS_INFINITE_REMOVED",
  COINS_BULK_GRANTED: "COINS_BULK_GRANTED",
  GEMS_GRANTED: "GEMS_GRANTED",
  GEMS_REVOKED: "GEMS_REVOKED",
  GEMS_ADJUSTED: "GEMS_ADJUSTED",
  GEMS_SET: "GEMS_SET",
  GEMS_INFINITE_SET: "GEMS_INFINITE_SET",
  GEMS_INFINITE_REMOVED: "GEMS_INFINITE_REMOVED",
  PASSWORD_RESET: "PASSWORD_RESET",
  OWNERSHIP_TRANSFERRED: "OWNERSHIP_TRANSFERRED",
  BROADCAST_CREATED: "BROADCAST_CREATED",
  BROADCAST_UPDATED: "BROADCAST_UPDATED",
  BROADCAST_DELETED: "BROADCAST_DELETED",
  BROADCAST_SENT: "BROADCAST_SENT",
  TICKET_CREATED: "TICKET_CREATED",
  TICKET_UPDATED: "TICKET_UPDATED",
  TICKET_ASSIGNED: "TICKET_ASSIGNED",
  TICKET_RESOLVED: "TICKET_RESOLVED",
  TICKET_CLOSED: "TICKET_CLOSED",
  TICKET_NOTE_ADDED: "TICKET_NOTE_ADDED",
  MODERATION_REPORT_CREATED: "MODERATION_REPORT_CREATED",
  MODERATION_REPORT_RESOLVED: "MODERATION_REPORT_RESOLVED",
  MODERATION_ACTION_TAKEN: "MODERATION_ACTION_TAKEN",

  // User Management
  MFA_ENABLED: "MFA_ENABLED",
  MFA_DISABLED: "MFA_DISABLED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PASSWORD_POLICY_UPDATED: "PASSWORD_POLICY_UPDATED",
  SESSION_REVOKED: "SESSION_REVOKED",
  BULK_INVITE_SENT: "BULK_INVITE_SENT",
  USER_LIFECYCLE_ARCHIVED: "USER_LIFECYCLE_ARCHIVED",
  USER_LIFECYCLE_RESTORED: "USER_LIFECYCLE_RESTORED",

  // Device Management
  DEVICE_TRUST_UPDATED: "DEVICE_TRUST_UPDATED",
  DEVICE_BLACKLISTED: "DEVICE_BLACKLISTED",
  DEVICE_WHITELISTED: "DEVICE_WHITELISTED",
  DEVICE_FINGERPRINT_REGISTERED: "DEVICE_FINGERPRINT_REGISTERED",

  // License Management
  LICENSE_FEATURE_FLAG_UPDATED: "LICENSE_FEATURE_FLAG_UPDATED",
  LICENSE_TAG_ADDED: "LICENSE_TAG_ADDED",
  LICENSE_TAG_REMOVED: "LICENSE_TAG_REMOVED",
  LICENSE_TEMPLATE_CREATED: "LICENSE_TEMPLATE_CREATED",
  LICENSE_TEMPLATE_UPDATED: "LICENSE_TEMPLATE_UPDATED",
  LICENSE_TEMPLATE_DELETED: "LICENSE_TEMPLATE_DELETED",
  LICENSE_BULK_CREATED: "LICENSE_BULK_CREATED",
  LICENSE_TRANSFERRED: "LICENSE_TRANSFERRED",
  LICENSE_TRIAL_STARTED: "LICENSE_TRIAL_STARTED",
  LICENSE_TRIAL_CONVERTED: "LICENSE_TRIAL_CONVERTED",
  LICENSE_VALIDATED: "LICENSE_VALIDATED",
} as const;

export const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"] as const;
export const RISK_LEVELS = ["Low", "Medium", "High", "Critical"] as const;

export const PERMISSION_GROUPS = {
  "License Management": [
    "Create Licenses",
    "View Licenses",
    "Edit Licenses",
    "Delete Licenses",
    "Regenerate License Keys",
    "Toggle License Status",
    "Emergency License Lockdown",
    "Manage License Features",
    "Manage License Tags",
    "Manage License Templates",
    "Bulk Create Licenses",
    "Transfer Licenses",
    "Validate Licenses",
    "Manage Trials",
    "View License Usage",
    "View License Events",
    "Export Licenses",
  ],
  "Device Management": [
    "View Devices",
    "Revoke Devices",
    "Manage Device Policies",
    "View Device Fingerprints",
    "Update Device Trust",
    "Blacklist Devices",
    "Whitelist Devices",
    "View Device Analytics",
    "Export Device Data",
    "Validate Devices",
  ],
  "User Management": [
    "View Users",
    "Create Users",
    "Edit Users",
    "Delete Users",
    "Manage MFA",
    "View Login History",
    "Manage Sessions",
    "User Lifecycle Management",
    "Bulk Invite Users",
    "Export Users",
  ],
  "Team Management": [
    "View Team Members",
    "Invite Team Members",
    "Remove Team Members",
    "Change Member Roles",
  ],
  "Password Policy": [
    "View Password Policy",
    "Edit Password Policy",
  ],
  "Role Management": [
    "View Roles",
    "Create Roles",
    "Edit Roles",
    "Delete Roles",
    "Clone Roles",
  ],
  Security: [
    "View Security Policies",
    "Edit Security Policies",
    "Toggle Security Policies",
  ],
  "Audit & Compliance": [
    "View Audit Logs",
    "Export Audit Logs",
    "Configure Audit Settings",
  ],
  "Billing & Revenue": [
    "View Revenue",
    "Manage Billing",
    "Compliance Reporting",
  ],
  Settings: [
    "Access Settings",
    "Edit System Settings",
    "Manage Notifications",
  ],
  Analytics: [
    "View Analytics",
    "Export Analytics Data",
  ],
  Reports: [
    "View Reports",
    "Create Reports",
    "Schedule Reports",
    "Export Reports",
  ],
  Broadcasts: [
    "View Broadcasts",
    "Create Broadcasts",
    "Send Broadcasts",
    "Delete Broadcasts",
  ],
  "Content Moderation": [
    "View Content",
    "Moderate Content",
    "Delete Content",
  ],
  Organizations: [
    "View Organizations",
    "Create Organizations",
    "Edit Organizations",
    "Delete Organizations",
  ],
  Support: [
    "View Tickets",
    "Manage Tickets",
    "Resolve Tickets",
  ],
  "Gems Management": [
    "View Gem Balances",
    "Grant Gems",
    "Revoke Gems",
    "View Gem History",
    "Manage Rewards",
    "gems.grant",
    "gems.revoke",
    "gems.bulk-grant",
    "gems.bulk-revoke",
    "gems.set",
    "gems.set-infinite",
    "gems.remove-infinite",
  ],
  "Coins Management": [
    "View Coin Balances",
    "Add Coins",
    "Remove Coins",
    "Refund Coins",
    "View Coin History",
    "coins.add",
    "coins.remove",
    "coins.refund",
    "coins.bulk-add",
    "coins.bulk-remove",
    "coins.set",
    "coins.set-infinite",
    "coins.remove-infinite",
    "coins.grant",
  ],
  "Premium Management": [
    "View Premium",
    "Grant Premium",
    "Revoke Premium",
    "Extend Premium",
    "Change Premium Plan",
    "View Premium History",
    "Manage Premium Requests",
    "premium.grant",
    "premium.revoke",
    "premium.extend",
    "premium.change-plan",
    "premium.bulk-grant",
    "premium.convert-lifetime",
    "premium.downgrade",
    "premium.convert-custom",
    "premium.requests.view",
    "premium.requests.approve",
    "premium.requests.reject",
    "premium.requests.convert",
  ],
} as const;

export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat();

export const CACHING = {
  DYNAMIC: "force-dynamic" as const,
};

export const AUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
export const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "";
export const AUTH = {
  MAX_LOGIN_ATTEMPTS: Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS) || 5,
  LOCKOUT_DURATION_MINUTES: Number(process.env.AUTH_LOCKOUT_DURATION_MINUTES) || 15,
  SESSION_MAX_AGE_SECONDS: Number(process.env.AUTH_SESSION_MAX_AGE_SECONDS) || 86400,
} as const;

export const RATE_LIMIT = {
  LOGIN_WINDOW_MS: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 60_000,
  LOGIN_MAX_ATTEMPTS: Number(process.env.RATE_LIMIT_LOGIN_MAX_ATTEMPTS) || 5,
  API_WINDOW_MS: Number(process.env.RATE_LIMIT_API_WINDOW_MS) || 60_000,
  API_MAX_REQUESTS: Number(process.env.RATE_LIMIT_API_MAX_REQUESTS) || 100,
  SENSITIVE_WINDOW_MS: Number(process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS) || 60_000,
  SENSITIVE_MAX_REQUESTS: Number(process.env.RATE_LIMIT_SENSITIVE_MAX_REQUESTS) || 30,
} as const;

export const CSP = {
  DIRECTIVES: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", "'strict-dynamic'"],
    STYLE_SRC: ["'self'"],
    IMG_SRC: ["'self'", "blob:", "data:", "https:"],
    FONT_SRC: ["'self'"],
    OBJECT_SRC: ["'none'"],
    BASE_URI: ["'self'"],
    FORM_ACTION: ["'self'"],
    FRAME_ANCESTORS: ["'none'"],
  },
} as const;
