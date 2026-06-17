import type { License, Activation, AuditLog, TeamMember, Role, Permission } from "@prisma/client";

export type LicenseWithActivations = License & { activations: Activation[] };
export type ActivationWithLicense = Activation & { license: License };
export type RoleWithPermissions = Role & { permissions: Permission[]; members: TeamMember[] };
export type TeamMemberWithRole = TeamMember & { role: Role };
export type AuditLogWithMeta = AuditLog;

export interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  suspendedLicenses: number;
  expiringSoon: number;
  totalDevices: number;
  totalCapacity: number;
  utilization: number;
  totalUsers: number;
  totalTeamMembers: number;
  totalRoles: number;
  totalAuditLogs: number;
  todayAuditLogs: number;
  totalSecurityPolicies: number;
  activePolicies: number;
  totalActivations: number;
  uniqueOrganizations: number;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  key: string;
  value: string;
  operator?: "eq" | "contains" | "gt" | "lt" | "gte" | "lte";
}

export interface PageProps<T = Record<string, string>> {
  params: Promise<T>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
