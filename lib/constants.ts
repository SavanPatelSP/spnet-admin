export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SP-NET";
export const APP_DESCRIPTION = "Enterprise Control Center";

export const LICENSE_KEY_PREFIX = process.env.LICENSE_KEY_PREFIX || "SPNET";

export const PLANS = ["FREE", "BASIC", "PRO", "BUSINESS", "ENTERPRISE", "LIFETIME"] as const;
export type Plan = (typeof PLANS)[number];

export const LICENSE_STATUSES = ["ACTIVE", "SUSPENDED", "PENDING", "EXPIRED", "REVOKED"] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

export const DEFAULT_PLAN: Plan = (process.env.NEXT_PUBLIC_DEFAULT_PLAN as Plan) || "ENTERPRISE";
export const DEFAULT_MAX_DEVICES = Number(process.env.NEXT_PUBLIC_DEFAULT_MAX_DEVICES) || 10;
export const DEFAULT_EXPIRY_YEAR = Number(process.env.NEXT_PUBLIC_DEFAULT_EXPIRY_YEAR) || 2027;
export const EXPIRING_SOON_DAYS = Number(process.env.NEXT_PUBLIC_EXPIRING_SOON_DAYS) || 30;
export const AUDIT_RETENTION_DAYS = Number(process.env.NEXT_PUBLIC_AUDIT_RETENTION_DAYS) || 365;
export const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en-IN";

export const SECURITY_POLICY_DAYS: Record<string, number> = {
  HIGH: Number(process.env.SECURITY_POLICY_HIGH_DAYS) || 7,
  STANDARD: Number(process.env.SECURITY_POLICY_STANDARD_DAYS) || 14,
  RELAXED: Number(process.env.SECURITY_POLICY_RELAXED_DAYS) || 30,
  CUSTOM: 0,
};

export const API_ROUTES = {
  LICENSES: {
    CREATE: "/api/licenses/create",
    UPDATE: "/api/licenses/update",
    DELETE: "/api/licenses/delete",
    TOGGLE_STATUS: "/api/licenses/toggle-status",
    REGENERATE_KEY: "/api/licenses/regenerate-key",
    EMERGENCY_MODE: "/api/licenses/emergency-mode",
  },
  DEVICES: {
    REVOKE: "/api/devices/revoke",
  },
  ACTIVATIONS: {
    DELETE: "/api/activations/delete",
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
    UPDATE_STATUS: "/api/team-members/update-status",
    CHANGE_ROLE: "/api/team-members/change-role",
    DELETE: "/api/team-members/delete",
  },
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
  ],
  "Device Management": [
    "View Devices",
    "Revoke Devices",
    "Manage Device Policies",
  ],
  "User Management": [
    "View Users",
    "Create Users",
    "Edit Users",
    "Delete Users",
  ],
  "Team Management": [
    "View Team Members",
    "Invite Team Members",
    "Remove Team Members",
    "Change Member Roles",
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
