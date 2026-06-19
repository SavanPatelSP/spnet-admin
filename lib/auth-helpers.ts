import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError, ForbiddenError } from "@/lib/security/errors";

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
  };
};

export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as AuthSession;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  if (session.user.licenseId) {
    const license = await prisma.license.findUnique({
      where: { id: session.user.licenseId },
      select: { status: true, expiresAt: true },
    });

    if (!license || license.status !== "ACTIVE" || license.expiresAt < new Date()) {
      redirect("/login");
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
  const session = await requireAuth();

  if (session.user.permissions.includes(permission)) {
    return session;
  }

  const perm = await prisma.permission.findFirst({
    where: {
      roleId: session.user.roleId,
      permission,
    },
  });

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
    const license = await prisma.license.findUnique({
      where: { id: session.user.licenseId },
      select: { status: true, expiresAt: true },
    });
    if (!license || license.status !== "ACTIVE" || license.expiresAt < new Date()) {
      throw new UnauthorizedError("License is not active or has expired");
    }
  }
  return session;
}

export async function requireApiPermission(permission: string): Promise<AuthSession> {
  const session = await requireApiAuth();
  if (session.user.permissions.includes(permission)) {
    return session;
  }
  const perm = await prisma.permission.findFirst({
    where: { roleId: session.user.roleId, permission },
  });
  if (!perm) {
    await prisma.auditLog.create({
      data: {
        action: "PERMISSION_DENIED",
        actorEmail: session.user.email,
        description: `Permission denied: ${permission} for ${session.user.email}`,
      },
    });
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
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
