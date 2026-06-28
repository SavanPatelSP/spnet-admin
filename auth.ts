import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { DefaultSession } from "next-auth";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH } from "@/lib/constants";
import { markStart, markEnd } from "@/lib/perf";
import { checkIpRateLimit, computeLockoutDuration } from "@/lib/security/ip-rate-limit";
import { logAuthEvent } from "@/lib/security/auth-logger";
import { handlePostLoginActivation, handleFingerprintCheck } from "@/lib/device-activation";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      roleId: string;
      licenseId: string | null;
      licenseStatus: string | null;
      licensePlan: string | null;
      permissions: string[];
      sessionRecordId: string | null;
      sessionCreatedAt: string | null;
      sessionExpiresAt: string | null;
      rolePermissionsVersion: number;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: string;
    roleId: string;
    licenseId: string | null;
    licenseStatus: string | null;
    licensePlan: string | null;
    permissions: string[];
    sessionRecordId: string | null;
    sessionCreatedAt: string | null;
    sessionExpiresAt: string | null;
    licenseLastVerifiedAt: string | null;
    rolePermissionsVersion: number;
  }
}

async function loginHistoryEntry(data: {
  teamMemberId: string | null; email: string; ipAddress: string;
  userAgent: string; success: boolean; failureReason?: string;
}) {
  const createData: {
    teamMemberId?: string; email?: string; ipAddress?: string;
    userAgent?: string; success: boolean; failureReason?: string;
  } = { success: data.success };
  if (data.teamMemberId) createData.teamMemberId = data.teamMemberId;
  if (data.email) createData.email = data.email;
  if (data.ipAddress) createData.ipAddress = data.ipAddress;
  if (data.userAgent) createData.userAgent = data.userAgent;
  if (data.failureReason) createData.failureReason = data.failureReason;

  try {
    await prisma.loginHistory.create({ data: createData });
  } catch (e) {
    console.error("Failed to create login history entry:", e);
  }
}

async function handleLoginFailure(
  memberOrEmail: { id: string; email: string } | string,
  ipAddress: string,
  userAgent: string,
  failureReason: string,
) {
  const email = typeof memberOrEmail === "string" ? memberOrEmail : memberOrEmail.email;
  const memberId: string | null = typeof memberOrEmail === "string" ? null : memberOrEmail.id;
  logAuthEvent("LOGIN_FAILURE", {
    teamMemberId: memberId ?? undefined, email,
    description: `Login failed: ${failureReason}`,
  });
  loginHistoryEntry({ teamMemberId: memberId, email, ipAddress, userAgent, success: false, failureReason });
}

async function checkLicenseValidity(license: {
  id: string; key: string; expiresAt: Date; status: string;
  plan: string; teamMemberId: string | null;
}, member: { id: string; email: string }, ipAddress: string, userAgent: string): Promise<string | null> {
  if (license.expiresAt < new Date()) {
    handleLoginFailure(member, ipAddress, userAgent, "License expired");
    logAuthEvent("LICENSE_EXPIRED_DENIAL", {
      teamMemberId: member.id, email: member.email,
      description: `Login denied: license ${license.key} expired on ${license.expiresAt.toISOString()}`,
    });
    return "License expired";
  }
  if (license.status === "SUSPENDED") {
    handleLoginFailure(member, ipAddress, userAgent, "License suspended");
    logAuthEvent("LICENSE_SUSPENDED_DENIAL", {
      teamMemberId: member.id, email: member.email,
      description: `Login denied: license ${license.key} is suspended`,
    });
    return "License suspended";
  }
  if (license.status !== "ACTIVE") {
    handleLoginFailure(member, ipAddress, userAgent, `License status: ${license.status}`);
    return `License status: ${license.status}`;
  }
  return null;
}

async function syncPermissionsVersion(
  token: { roleId: string; rolePermissionsVersion?: number; permissions?: string[] }
) {
  try {
    const role = await prisma.role.findUnique({
      where: { id: token.roleId },
      select: { permissionsVersion: true },
    });
    const currentVersion = role?.permissionsVersion ?? 0;
    if (currentVersion !== (token.rolePermissionsVersion ?? 0)) {
      const permissionRows = await prisma.permission.findMany({
        where: { roleId: token.roleId },
        select: { permission: true },
      });
      token.permissions = permissionRows.map(p => p.permission);
      token.rolePermissionsVersion = currentVersion;
    }
  } catch {
    // Best-effort; stale permissions acceptable temporarily
  }
}

async function revalidateLicense(token: {
  licenseId: string; licenseStatus?: string;
  licenseLastVerifiedAt?: string | null;
}) {
  const LICENSE_REFRESH_MS = 5 * 60 * 1000;
  const lastVerified = token.licenseLastVerifiedAt
    ? new Date(token.licenseLastVerifiedAt).getTime()
    : 0;
  if (Date.now() - lastVerified > LICENSE_REFRESH_MS) {
    try {
      const license = await prisma.license.findUnique({
        where: { id: token.licenseId },
        select: { status: true, expiresAt: true },
      });
      if (!license) return false;
      if (license.expiresAt < new Date() || license.status !== "ACTIVE") return false;
      if (token.licenseStatus !== license.status) {
        token.licenseStatus = license.status;
      }
      token.licenseLastVerifiedAt = new Date().toISOString();
    } catch {
      // Best-effort; license state re-checked on next interval
    }
  }
  return true;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
        licenseKey: { label: "License Key", type: "text" },
      },
      async authorize(credentials) {
        markStart("AUTH_TOTAL");

        const headersList = await headers();
        const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
          || headersList.get("x-real-ip")
          || "127.0.0.1";
        const userAgent = headersList.get("user-agent") || "Unknown";

        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const licenseKey = String(credentials?.licenseKey ?? "").trim();

        if (!email || !password || !licenseKey) return null;

        const ipCheck = checkIpRateLimit(ipAddress);
        if (!ipCheck.allowed) {
          logAuthEvent("LOGIN_FAILURE", {
            email,
            description: `Login blocked: IP rate limit exceeded for ${ipAddress}, retry after ${ipCheck.retryAfter}s`,
          });
          return null;
        }

        let member: { id: string; email: string; name: string | null; password: string;
          roleId: string; licenseId: string; status: string; failedLoginAttempts: number;
          lockedUntil: Date | null; lastLogin: Date | null; lastLoginIp: string | null;
          lastUserAgent: string | null;
          license: { id: string; key: string; expiresAt: Date; status: string; plan: string; teamMemberId: string | null; } | null;
        } | null;
        let roleName: string | null = null;
        let rolePermissionsVersion = 0;

        try {
          markStart("TEAM_MEMBER_LOOKUP");
          member = await prisma.teamMember.findUnique({
            where: { email },
            include: { license: true },
          }) as typeof member;
          markEnd("TEAM_MEMBER_LOOKUP", member ? 1 : 0);
        } catch (e) {
          console.error("TeamMember lookup failed:", e);
          markEnd("TEAM_MEMBER_LOOKUP", 0);
          return null;
        }

        if (!member) {
          handleLoginFailure(email, ipAddress, userAgent, "No account found");
          return null;
        }

        if (member.status !== "ACTIVE") {
          logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id, email,
            description: `Login blocked: account status is ${member.status}`,
          });
          return null;
        }

        try {
          const role = await prisma.role.findUnique({
            where: { id: member.roleId },
            select: { name: true, permissionsVersion: true },
          });
          if (role) {
            roleName = role.name;
            rolePermissionsVersion = role.permissionsVersion ?? 0;
          }
        } catch {
          // permissionsVersion column may not exist in production
        }

        if (member.lockedUntil && member.lockedUntil > new Date()) {
          logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id, email,
            description: `Login blocked: account locked until ${member.lockedUntil.toISOString()}`,
          });
          return null;
        }

        markStart("BCRYPT_COMPARE");
        const isValidPassword = await bcrypt.compare(password, member.password);
        markEnd("BCRYPT_COMPARE");

        if (!isValidPassword) {
          const newAttempts = member.failedLoginAttempts + 1;
          const lockoutMs = computeLockoutDuration(Math.floor(newAttempts / AUTH.MAX_LOGIN_ATTEMPTS));
          const update: { failedLoginAttempts: number; lockedUntil?: Date } = {
            failedLoginAttempts: newAttempts,
          };
          if (newAttempts >= AUTH.MAX_LOGIN_ATTEMPTS) {
            update.lockedUntil = new Date(Date.now() + Math.max(lockoutMs, AUTH.LOCKOUT_DURATION_MINUTES * 60 * 1000));
            update.failedLoginAttempts = 0;
          }
          prisma.teamMember.update({ where: { id: member.id }, data: update }).catch(() => {});
          handleLoginFailure({ id: member.id, email }, ipAddress, userAgent, `Invalid password (attempt ${newAttempts})`);
          return null;
        }

        if (!member.license) {
          handleLoginFailure({ id: member.id, email }, ipAddress, userAgent, "No license assigned");
          return null;
        }

        const license = member.license;

        if (license.key !== licenseKey) {
          logAuthEvent("INVALID_LICENSE_KEY", {
            teamMemberId: member.id, email,
            description: `Login failed: invalid license key provided for ${email}`,
          });
          loginHistoryEntry({ teamMemberId: member.id, email, ipAddress, userAgent, success: false, failureReason: "Invalid license key" });
          return null;
        }

        if (member.licenseId !== license.id) {
          logAuthEvent("INVALID_LICENSE_KEY", {
            teamMemberId: member.id, email,
            description: `License ${license.key} does not belong to ${email}`,
          });
          return null;
        }

        const licenseError = await checkLicenseValidity(license, { id: member.id, email }, ipAddress, userAgent);
        if (licenseError) return null;

        // ── Critical path: create session and fetch permissions ──
        markStart("SESSION_CREATE");
        markStart("PERMISSION_QUERY");
        const sessionToken = crypto.randomUUID();
        const sessionCreatedAt = new Date();
        const sessionExpiresAt = new Date(sessionCreatedAt.getTime() + AUTH.SESSION_MAX_AGE_SECONDS * 1000);
        let sessionRecordId: string | null = null;
        let permissions: string[] = [];

        try {
          const [sessionRecord, permissionRows] = await Promise.all([
            prisma.session.create({
              data: { teamMemberId: member.id, token: sessionToken, ipAddress, userAgent, expiresAt: sessionExpiresAt },
            }),
            prisma.permission.findMany({
              where: { roleId: member.roleId },
              select: { permission: true },
            }),
          ]);
          sessionRecordId = sessionRecord.id;
          permissions = permissionRows.map(p => p.permission);
          markEnd("PERMISSION_QUERY", permissions.length);
          markEnd("SESSION_CREATE");
        } catch {
          markEnd("PERMISSION_QUERY");
          markEnd("SESSION_CREATE");
          return null;
        }

        // ── Non-critical operations (fire-and-forget) ──
        (async () => {
          try {
            await prisma.teamMember.update({
              where: { id: member.id },
              data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date(), lastLoginIp: ipAddress, lastUserAgent: userAgent },
            });
          } catch (e) { console.error("Failed to update member post-login:", e); }
          try {
            if (sessionRecordId) {
              await prisma.auditLog.create({
                data: { action: "SESSION_CREATED", entityId: sessionRecordId, entityType: "session", actorEmail: member.email, actorName: member.name, description: `Session created for ${member.email}` },
              });
            }
          } catch (e) { console.error("Failed to create session audit log:", e); }
          try {
            const oldSessions = await prisma.session.findMany({
              where: { teamMemberId: member.id },
              orderBy: { createdAt: "desc" },
              skip: 4,
            });
            if (oldSessions.length > 0) {
              await prisma.session.deleteMany({ where: { id: { in: oldSessions.map(s => s.id) } } });
            }
          } catch (e) { console.error("Failed to clean old sessions:", e); }
          try {
            await loginHistoryEntry({ teamMemberId: member.id, email, ipAddress, userAgent, success: true });
          } catch (e) { console.error("Failed to create login history:", e); }
          try {
            await handlePostLoginActivation(member, ipAddress, userAgent);
          } catch (e) { console.error("Failed to handle post-login activation:", e); }
          try {
            if (sessionRecordId) {
              await handleFingerprintCheck(ipAddress, userAgent, member.id, sessionRecordId, email, member.name);
            }
          } catch (e) { console.error("Failed to check fingerprint:", e); }
          logAuthEvent("LOGIN_SUCCESS", {
            teamMemberId: member.id, email,
            description: `Login successful for ${email}`,
          });
        })().catch((e) => console.error("Post-login fire-and-forget failed:", e));

        markEnd("AUTH_TOTAL");
        return {
          id: member.id,
          email: member.email,
          name: member.name,
          role: roleName ?? "Unknown",
          roleId: member.roleId,
          licenseId: license.id,
          licenseStatus: license.status,
          licensePlan: license.plan,
          permissions,
          rolePermissionsVersion,
          sessionRecordId,
          sessionCreatedAt: sessionCreatedAt.toISOString(),
          sessionExpiresAt: sessionExpiresAt.toISOString(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role: string; roleId: string; licenseId: string | null;
          licenseStatus: string | null; licensePlan: string | null; permissions: string[];
          sessionRecordId: string | null; sessionCreatedAt: string | null; sessionExpiresAt: string | null; };
        token.id = u.id;
        token.role = u.role;
        token.roleId = u.roleId;
        token.licenseId = u.licenseId;
        token.licenseStatus = u.licenseStatus;
        token.licensePlan = u.licensePlan;
        token.permissions = u.permissions;
        token.sessionRecordId = u.sessionRecordId;
        token.sessionCreatedAt = u.sessionCreatedAt;
        token.sessionExpiresAt = u.sessionExpiresAt;
        token.licenseLastVerifiedAt = new Date().toISOString();
      } else {
        await syncPermissionsVersion(token);
        if (!token.licenseId) return null;
        const valid = await revalidateLicense(token as { licenseId: string; licenseStatus?: string; licenseLastVerifiedAt?: string | null });
        if (!valid) return null;
        if (token.sessionExpiresAt && new Date(token.sessionExpiresAt) < new Date()) return null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.roleId = token.roleId;
      session.user.licenseId = token.licenseId;
      session.user.licenseStatus = token.licenseStatus;
      session.user.licensePlan = token.licensePlan;
      session.user.permissions = token.permissions || [];
      session.user.sessionRecordId = token.sessionRecordId || null;
      session.user.sessionCreatedAt = token.sessionCreatedAt || null;
      session.user.sessionExpiresAt = token.sessionExpiresAt || null;
      session.user.rolePermissionsVersion = token.rolePermissionsVersion ?? 0;
      return session;
    },
  },
  events: {
    async signOut(message) {
      if (!("token" in message) || !message.token?.sessionRecordId) return;
      const token = message.token as { sessionRecordId: string; email?: string; name?: string; role?: string };
      try {
        await prisma.session.update({ where: { id: token.sessionRecordId }, data: { expiresAt: new Date() } });
        await prisma.auditLog.create({
          data: {
            action: "LOGOUT", actorEmail: token.email || "unknown", actorName: token.name || null,
            actorRole: token.role || null, entityType: "session", entityId: token.sessionRecordId,
            description: `User logged out: session ${token.sessionRecordId.slice(0, 12)}...`,
          },
        });
      } catch {
        // Swallow errors during sign-out
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: AUTH.SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
});
