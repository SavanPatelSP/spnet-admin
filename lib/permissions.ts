import { PERMISSION_GROUPS, ALL_PERMISSIONS, ROLE_PRICES } from "./constants";

export const ACCESS_COST_PER_PERMISSION = 0.10;

export type PermissionStatus = "granted" | "restricted" | "custom";

export interface PermissionCounts {
  total: number;
  default: number;
  restricted: number;
  custom: number;
  coveragePercent: number;
}

export interface PermissionCategoryInfo {
  name: string;
  permissions: string[];
  granted: number;
  total: number;
}

export interface RolePermissionInfo {
  counts: PermissionCounts;
  categories: PermissionCategoryInfo[];
  defaultPermissions: string[];
  restrictedPermissions: string[];
}

export function getRolePrice(roleName: string): number {
  const upper = roleName.toUpperCase().replace(/\s+/g, "_");
  if (ROLE_PRICES[upper] !== undefined) return ROLE_PRICES[upper];
  const match = Object.entries(ROLE_PRICES).find(
    ([key]) => upper.includes(key) || key.includes(upper)
  );
  return match?.[1] ?? 0;
}

export function getRoleHierarchyLevel(roleName: string): number {
  const map: Record<string, number> = {
    OWNER: 100, SUPER_ADMIN: 80, ADMIN: 60, MANAGER: 60,
    SUPERVISOR: 50, MODERATOR: 40, SUPPORT: 30, VIEWER: 10,
  };
  const upper = roleName.toUpperCase().replace(/\s+/g, "_");
  if (map[upper] !== undefined) return map[upper];
  for (const [key, val] of Object.entries(map)) {
    if (upper.includes(key) || key.includes(upper)) return val;
  }
  return 0;
}

export function getDefaultPermissions(roleName: string): string[] {
  const level = getRoleHierarchyLevel(roleName);
  if (level >= 100) return [...ALL_PERMISSIONS];
  return ALL_PERMISSIONS.filter((p) => {
    if (level >= 80) return !p.startsWith("premium.") && !p.startsWith("coins.") && !p.startsWith("gems.");
    if (level >= 60) return !p.startsWith("premium.") && !p.startsWith("coins.") && !p.startsWith("gems.") && p !== "Emergency License Lockdown" && p !== "Delete Licenses" && p !== "Manage Billing" && p !== "Regenerate License Keys" && p !== "Transfer Licenses";
    if (level >= 50) return !p.startsWith("premium.") && !p.startsWith("coins.") && !p.startsWith("gems.") && !p.includes("Delete") && !p.includes("Emergency") && !p.includes("Billing") && !p.includes("Grant") && !p.includes("Bulk") && !p.includes("Transfer") && !p.includes("Regenerate") && !p.includes("Grant") && !p.includes("Clone");
    if (level >= 40) return !p.startsWith("premium.") && !p.startsWith("coins.") && !p.startsWith("gems.") && !p.includes("Delete") && !p.includes("Emergency") && !p.includes("Billing") && !p.includes("Grant") && !p.includes("Bulk") && !p.includes("Transfer") && !p.includes("Regenerate") && !p.includes("Clone") && !p.includes("Manage");
    if (level >= 30) return !p.startsWith("premium.") && !p.startsWith("coins.") && !p.startsWith("gems.") && !p.includes("Delete") && !p.includes("Create") && !p.includes("Edit") && !p.includes("Emergency") && !p.includes("Billing") && !p.includes("Grant") && !p.includes("Bulk") && !p.includes("Transfer") && !p.includes("Regenerate") && !p.includes("Clone") && !p.includes("Manage") && !p.includes("Configure") && !p.includes("Moderate") && !p.includes("Schedule");
    return p.startsWith("View");
  });
}

export function getRestrictedPermissions(roleName: string): string[] {
  return ALL_PERMISSIONS.filter((p) => !getDefaultPermissions(roleName).includes(p));
}

export function getPermissionCounts(roleName: string): PermissionCounts {
  const total = ALL_PERMISSIONS.length;
  const defaultPerms = getDefaultPermissions(roleName);
  const restricted = getRestrictedPermissions(roleName);
  return {
    total,
    default: defaultPerms.length,
    restricted: restricted.length,
    custom: 0,
    coveragePercent: total > 0 ? Math.round((defaultPerms.length / total) * 100) : 0,
  };
}

export function getCategoryCounts(roleName: string): PermissionCategoryInfo[] {
  return Object.entries(PERMISSION_GROUPS).map(([name, perms]) => {
    const defaultPerms = getDefaultPermissions(roleName);
    const granted = perms.filter((p) => defaultPerms.includes(p)).length;
    return { name, permissions: [...perms], granted, total: perms.length };
  });
}

export function getRolePermissionInfo(roleName: string): RolePermissionInfo {
  return {
    counts: getPermissionCounts(roleName),
    categories: getCategoryCounts(roleName),
    defaultPermissions: getDefaultPermissions(roleName),
    restrictedPermissions: getRestrictedPermissions(roleName),
  };
}

export function calculateCosts(roleName: string, customPermsCount?: number) {
  const seatCost = getRolePrice(roleName);
  const basePerms = getDefaultPermissions(roleName).length;
  const actualPerms = customPermsCount ?? basePerms;
  const accessCost = actualPerms * ACCESS_COST_PER_PERMISSION;
  const grandTotal = seatCost + accessCost;
  return { seatCost, basePermCount: basePerms, actualPermCount: actualPerms, accessCost, grandTotal };
}

export function getPermissionCoverage(enabledCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((enabledCount / total) * 100);
}
