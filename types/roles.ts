export enum Role {
  OWNER = "OWNER",
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  SUPPORT = "SUPPORT",
  VIEWER = "VIEWER",
}

export const ROLE_HIERARCHY: Record<string, number> = {
  [Role.OWNER]: 100,
  [Role.SUPER_ADMIN]: 80,
  [Role.ADMIN]: 60,
  [Role.MODERATOR]: 40,
  [Role.SUPPORT]: 30,
  [Role.VIEWER]: 10,
};

export const ALL_ROLES = Object.values(Role);
