import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError, ForbiddenError } from "@/lib/security/errors";
import { markStart, markEnd } from "@/lib/perf";

const licenseCache = new Map<string, { status: string; expiresAt: string; cachedAt: number }>();
const LICENSE_CACHE_TTL_MS = 60_000;

export type AuthSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    licenseId: string | null;
    licenseStatus: string | null;
    licensePlan: string | null;
    permissions: string[];
    sessionRecordId: string | null;
    sessionCreatedAt: string | null;
    sessionExpiresAt: string | null;
  };
};

export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await auth();
  if (!session?.user?.id) {
    console.error("AUTH SESSION FAIL: auth() returned", JSON.stringify(session));
    return null;
  }
  return session as AuthSession;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  if (session.user.licenseId) {
    const cached = licenseCache.get(session.user.id);
    if (cached && Date.now() - cached.cachedAt < LICENSE_CACHE_TTL_MS) {
      if (cached.status !== "ACTIVE" || new Date(cached.expiresAt) < new Date()) {
        redirect("/login");
      }
    } else {
      const license = await prisma.license.findUnique({
        where: { id: session.user.licenseId },
        select: { status: true, expiresAt: true },
      });
      if (!license || license.status !== "ACTIVE" || license.expiresAt < new Date()) {
        redirect("/login");
      }
      licenseCache.set(session.user.id, {
        status: license.status,
        expiresAt: license.expiresAt.toISOString(),
        cachedAt: Date.now(),
      });
    }
  }

  return session;
}

export function hasPermission(
  session: AuthSession | null,
  permission: string
): boolean {
  if (!session) return false;
  return session.user.permissions.includes(permission);
}

export async function requirePermission(
  permission: string
): Promise<AuthSession> {
  markStart("PERMISSION_CHECK");
  const session = await requireAuth();

  if (session.user.permissions.includes(permission)) {
    markEnd("PERMISSION_CHECK", 0);
    return session;
  }

  markStart("PERMISSION_DB_FALLBACK");
  const perm = await prisma.permission.findFirst({
    where: {
      roleId: session.user.roleId,
      permission,
    },
  });
  markEnd("PERMISSION_DB_FALLBACK", perm ? 1 : 0);

  if (!perm) {
    await prisma.auditLog.create({
      data: {
        action: "PERMISSION_DENIED",
        actorEmail: session.user.email,
        description: `Permission denied: ${permission} for ${session.user.email}`,
      },
    });
    redirect("/unauthorized");
  }

  return session;
}

export async function requireApiAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) throw new UnauthorizedError();
  if (session.user.licenseId) {
    const cached = licenseCache.get(session.user.id);
    if (cached && Date.now() - cached.cachedAt < LICENSE_CACHE_TTL_MS) {
      if (cached.status !== "ACTIVE" || new Date(cached.expiresAt) < new Date()) {
        throw new UnauthorizedError("License is not active or has expired");
      }
    } else {
      const license = await prisma.license.findUnique({
        where: { id: session.user.licenseId },
        select: { status: true, expiresAt: true },
      });
      if (!license || license.status !== "ACTIVE" || license.expiresAt < new Date()) {
        throw new UnauthorizedError("License is not active or has expired");
      }
      licenseCache.set(session.user.id, {
        status: license.status,
        expiresAt: license.expiresAt.toISOString(),
        cachedAt: Date.now(),
      });
    }
  }
  return session;
}

export async function requireApiPermission(permission: string): Promise<AuthSession> {
  markStart("API_PERMISSION_CHECK");
  const session = await requireApiAuth();
  if (session.user.permissions.includes(permission)) {
    markEnd("API_PERMISSION_CHECK", 0);
    return session;
  }
  markStart("API_PERMISSION_DB_FALLBACK");
  console.warn(`requireApiPermission: "${permission}" not in token permissions for ${session.user.email}, checking DB...`);
  const perm = await prisma.permission.findFirst({
    where: { roleId: session.user.roleId, permission },
  });
  markEnd("API_PERMISSION_DB_FALLBACK", perm ? 1 : 0);
  if (!perm) {
    console.error(`requireApiPermission: "${permission}" not found in DB for roleId ${session.user.roleId}`);
    await prisma.auditLog.create({
      data: {
        action: "PERMISSION_DENIED",
        actorEmail: session.user.email,
        description: `Permission denied: ${permission} for ${session.user.email}`,
      },
    });
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
  markEnd("API_PERMISSION_CHECK");
  return session;
}

export async function checkLicenseStatus(session: AuthSession): Promise<{
  valid: boolean;
  reason?: string;
}> {
  if (!session.user.licenseId) {
    return { valid: false, reason: "No license assigned" };
  }

  const license = await prisma.license.findUnique({
    where: { id: session.user.licenseId },
  });

  if (!license) {
    return { valid: false, reason: "License not found" };
  }

  if (license.status !== "ACTIVE") {
    return { valid: false, reason: `License is ${license.status.toLowerCase()}` };
  }

  if (license.expiresAt < new Date()) {
    return { valid: false, reason: "License has expired" };
  }

  return { valid: true };
}
