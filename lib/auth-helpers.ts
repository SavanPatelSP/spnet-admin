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
    sessionRecordId: string | null;
    sessionCreatedAt: string | null;
    sessionExpiresAt: string | null;
  };
};

export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as AuthSession;
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) redirect("/login");
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
  if (session.user.permissions.includes(permission)) return session;
  await prisma.auditLog.create({
    data: {
      action: "PERMISSION_DENIED",
      actorEmail: session.user.email,
      description: `Permission denied: ${permission} for ${session.user.email}`,
    },
  });
  redirect("/unauthorized");
}

export async function requireApiAuth(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function requireApiPermission(permission: string): Promise<AuthSession> {
  const session = await requireApiAuth();
  if (session.user.permissions.includes(permission)) return session;
  throw new ForbiddenError(`Missing permission: ${permission}`);
}

export async function checkLicenseStatus(session: AuthSession): Promise<{
  valid: boolean;
  reason?: string;
}> {
  if (!session.user.licenseId) {
    return { valid: false, reason: "No license assigned" };
  }
  if (session.user.licenseStatus !== "ACTIVE") {
    return { valid: false, reason: `License is ${(session.user.licenseStatus || "unknown").toLowerCase()}` };
  }
  return { valid: true };
}
