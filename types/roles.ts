export enum Role {
  OWNER = "OWNER",
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  SUPERVISOR = "SUPERVISOR",
  MODERATOR = "MODERATOR",
  SUPPORT = "SUPPORT",
  VIEWER = "VIEWER",
}

export const ROLE_HIERARCHY: Record<string, number> = {
  [Role.OWNER]: 100,
  [Role.SUPER_ADMIN]: 80,
  [Role.ADMIN]: 60,
  [Role.MANAGER]: 60,
  [Role.SUPERVISOR]: 50,
  [Role.MODERATOR]: 40,
  [Role.SUPPORT]: 30,
  [Role.VIEWER]: 10,
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  [Role.OWNER]: "Full platform access with ownership, billing, security, and system configuration controls",
  [Role.SUPER_ADMIN]: "Nearly full access excluding Owner-level overrides",
  [Role.ADMIN]: "Operations management with user and organization administration",
  [Role.MANAGER]: "Operations management with user and organization administration",
  [Role.SUPERVISOR]: "Team oversight with moderator supervision and workflow approvals",
  [Role.MODERATOR]: "Moderation tools for user actions and report management",
  [Role.SUPPORT]: "Customer support actions with read/write limited access",
  [Role.VIEWER]: "Read-only access to permitted resources",
};

export const ALL_ROLES = Object.values(Role);
