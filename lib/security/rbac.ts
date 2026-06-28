import { Role, ROLE_HIERARCHY, ALL_ROLES } from "@/types/roles";

export { Role, ROLE_HIERARCHY };

export const ROLES = ALL_ROLES;

export function roleGte(role: string, minimum: Role): boolean {
  const userLevel = ROLE_HIERARCHY[role] ?? 0;
  const minLevel = ROLE_HIERARCHY[minimum];
  if (minLevel === undefined) return false;
  return userLevel >= minLevel;
}

export function roleLt(role: string, maximum: Role): boolean {
  const userLevel = ROLE_HIERARCHY[role] ?? 0;
  const maxLevel = ROLE_HIERARCHY[maximum];
  if (maxLevel === undefined) return false;
  return userLevel < maxLevel;
}

type RouteRoles = {
  requiredRole?: Role;
  allowedRoles?: Role[];
  check?: (role: string) => boolean;
};

export const ADMIN_ROUTE_ROLES: Record<string, RouteRoles> = {
  "/owner": { requiredRole: Role.OWNER },
  "/owner/:path*": { requiredRole: Role.OWNER },
  "/settings/roles": { requiredRole: Role.SUPER_ADMIN },
  "/settings/roles/:path*": { requiredRole: Role.SUPER_ADMIN },
  "/settings/system": { requiredRole: Role.SUPER_ADMIN },
  "/settings/security": { requiredRole: Role.SUPER_ADMIN },
  "/settings/team-members": { requiredRole: Role.ADMIN },
  "/settings/team-members/:path*": { requiredRole: Role.ADMIN },
  "/settings/audit": { requiredRole: Role.ADMIN },
  "/settings/licensing": { requiredRole: Role.ADMIN },
  "/team-members": { requiredRole: Role.ADMIN },
  "/roles": { requiredRole: Role.SUPER_ADMIN },
  "/roles/:path*": { requiredRole: Role.SUPER_ADMIN },
  "/users": { requiredRole: Role.MODERATOR },
  "/users/:path*": { requiredRole: Role.MODERATOR },
  "/moderation": { requiredRole: Role.MODERATOR },
  "/moderation/:path*": { requiredRole: Role.MODERATOR },
  "/support": { allowedRoles: [Role.SUPPORT, Role.MODERATOR] },
  "/support/:path*": { allowedRoles: [Role.SUPPORT, Role.MODERATOR] },
  "/broadcasts": { requiredRole: Role.MODERATOR },
  "/broadcasts/:path*": { requiredRole: Role.MODERATOR },
  "/content": { requiredRole: Role.MODERATOR },
  "/premium": { requiredRole: Role.ADMIN },
  "/premium/:path*": { requiredRole: Role.ADMIN },
  "/premium-requests": { requiredRole: Role.ADMIN },
  "/premium-requests/:path*": { requiredRole: Role.ADMIN },
  "/analytics": { requiredRole: Role.VIEWER },
  "/reports": { requiredRole: Role.VIEWER },
  "/revenue": { requiredRole: Role.VIEWER },
  "/audit-logs": { requiredRole: Role.ADMIN },
  "/security": { requiredRole: Role.ADMIN },
  "/system-health": { requiredRole: Role.ADMIN },
};

export function checkRouteAccess(
  role: string | undefined | null,
  pathname: string
): { allowed: boolean; reason?: string } {
  if (!role) return { allowed: false, reason: "No role assigned" };

  const adminBase = pathname.replace(/^\/admin/, "");
  const normalizedPath = adminBase || pathname;

  let matchedRoute: { roles: RouteRoles; pattern: string } | null = null;

  for (const [pattern, routeRoles] of Object.entries(ADMIN_ROUTE_ROLES)) {
    const regexPattern = pattern
      .replace(/\//g, "\\/")
      .replace(/:path\*/g, ".*")
      .replace(/:id\*/g, "[^/]+")
      .replace(/:id/g, "[^/]+");
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(normalizedPath)) {
      matchedRoute = { roles: routeRoles, pattern };
      break;
    }
  }

  if (!matchedRoute) return { allowed: true };

  const { roles } = matchedRoute;

  if (roles.check) {
    const allowed = roles.check(role);
    if (!allowed) return { allowed: false, reason: `Insufficient role: ${role}` };
    return { allowed: true };
  }

  if (roles.requiredRole) {
    if (!roleGte(role, roles.requiredRole)) {
      return {
        allowed: false,
        reason: `Requires at least ${roles.requiredRole} role, got ${role}`,
      };
    }
    return { allowed: true };
  }

  if (roles.allowedRoles) {
    if (!roles.allowedRoles.includes(role as Role)) {
      return {
        allowed: false,
        reason: `Requires one of [${roles.allowedRoles.join(", ")}] roles, got ${role}`,
      };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

export function hasRole(role: string, minimum: Role): boolean {
  return roleGte(role, minimum);
}

export function isValidRole(role: string | undefined | null): role is Role {
  if (!role) return false;
  return ROLES.includes(role as Role);
}
