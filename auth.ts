import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { DefaultSession } from "next-auth";
import { AUTH } from "@/lib/constants";
import { resolveGeoFromApi } from "@/lib/geo";

const IP_ATTEMPT_WINDOW = 60_000;
const IP_MAX_ATTEMPTS = 10;

interface IpRecord {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number;
  strikeCount: number;
}

const ipAttempts = new Map<string, IpRecord>();

function checkIpRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const record = ipAttempts.get(ip);

  if (record && record.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  if (record && record.firstAttempt < now - IP_ATTEMPT_WINDOW) {
    ipAttempts.set(ip, { attempts: 1, firstAttempt: now, blockedUntil: 0, strikeCount: record.strikeCount });
    return { allowed: true, retryAfter: 0 };
  }

  if (record && record.attempts >= IP_MAX_ATTEMPTS) {
    const blockDuration = [60_000, 300_000, 600_000, 3_600_000][Math.min(record.strikeCount, 3)];
    record.blockedUntil = now + blockDuration;
    record.attempts = 0;
    record.strikeCount += 1;
    return { allowed: false, retryAfter: Math.ceil(blockDuration / 1000) };
  }

  if (record) {
    record.attempts += 1;
  } else {
    ipAttempts.set(ip, { attempts: 1, firstAttempt: now, blockedUntil: 0, strikeCount: 0 });
  }

  return { allowed: true, retryAfter: 0 };
}

const LOCKOUT_STAGES = [15, 60, 360, 1440];

function computeLockoutDuration(strikeCount: number): number {
  return LOCKOUT_STAGES[Math.min(strikeCount, LOCKOUT_STAGES.length - 1)] * 60 * 1000;
}

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
  }
}

async function logAuthEvent(
  action: string,
  details: {
    teamMemberId?: string;
    email?: string;
    description: string;
  }
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.auditLog.create({
      data: {
        action,
        actorEmail: details.email || "unknown",
        description: details.description,
      },
    });
  } catch {
    // Swallow audit logging errors to prevent auth loops
  }
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
      async authorize(credentials, req) {
        try {
          const { prisma } = await import("@/lib/prisma");

          const headersList = await import("next/headers").then(m => m.headers());
          const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
            || headersList.get("x-real-ip")
            || "127.0.0.1";
          const userAgent = headersList.get("user-agent") || "Unknown";

          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "");
          const licenseKey = String(credentials?.licenseKey ?? "").trim();

          if (!email || !password || !licenseKey) {
            return null;
          }

          const ipCheck = checkIpRateLimit(ipAddress);
          if (!ipCheck.allowed) {
            await logAuthEvent("LOGIN_FAILURE", {
              email,
              description: `Login blocked: IP rate limit exceeded for ${ipAddress}, retry after ${ipCheck.retryAfter}s`,
            });
            return null;
          }

          const bcrypt = await import("bcryptjs");

          // 1. Find user by email
          const member = await prisma.teamMember.findUnique({
            where: { email },
            include: {
              role: true,
              license: true,
            },
          });

          if (!member) {
            await logAuthEvent("LOGIN_FAILURE", {
              email,
              description: `Login failed: no account found for ${email}`,
            });
            await prisma.loginHistory.create({
              data: { email, ipAddress, userAgent, success: false, failureReason: "No account found" },
            });
            return null;
          }

          // Check lockout (progressive duration)
          if (member.lockedUntil && member.lockedUntil > new Date()) {
            await logAuthEvent("LOGIN_FAILURE", {
              teamMemberId: member.id,
              email,
              description: `Login blocked: account locked until ${member.lockedUntil.toISOString()}`,
            });
            return null;
          }

          // 2. Verify password
          const isValidPassword = await bcrypt.compare(password, member.password);
          if (!isValidPassword) {
            const newAttempts = member.failedLoginAttempts + 1;
            const strikeCount = member.failedLoginAttempts >= AUTH.MAX_LOGIN_ATTEMPTS
              ? (await prisma.teamMember.findUnique({ where: { id: member.id }, select: { failedLoginAttempts: true } }))?.failedLoginAttempts ?? 0
              : 0;
            const lockoutDuration = computeLockoutDuration(Math.floor(newAttempts / AUTH.MAX_LOGIN_ATTEMPTS));
            const update: {
              failedLoginAttempts: number;
              lockedUntil?: Date;
            } = {
              failedLoginAttempts: newAttempts,
            };
            if (newAttempts >= AUTH.MAX_LOGIN_ATTEMPTS) {
              update.lockedUntil = new Date(Date.now() + Math.max(lockoutDuration, AUTH.LOCKOUT_DURATION_MINUTES * 60 * 1000));
              update.failedLoginAttempts = 0;
            }
            await prisma.teamMember.update({
              where: { id: member.id },
              data: update,
            });

            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "Invalid password" },
            });

            await logAuthEvent("LOGIN_FAILURE", {
              teamMemberId: member.id,
              email,
              description: `Login failed: invalid password (attempt ${newAttempts})`,
            });
            return null;
          }

          // 3. Check user has a license assigned
          if (!member.license) {
            await logAuthEvent("LOGIN_FAILURE", {
              teamMemberId: member.id,
              email,
              description: `Login failed: no license assigned to ${email}`,
            });
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "No license assigned" },
            });
            return null;
          }

          const license = member.license;

          // 4. License key matches
          if (license.key !== licenseKey) {
            await logAuthEvent("INVALID_LICENSE_KEY", {
              teamMemberId: member.id,
              email,
              description: `Login failed: invalid license key provided for ${email}`,
            });
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "Invalid license key" },
            });
            return null;
          }

          // 5. License belongs to this user
          if (member.licenseId !== license.id) {
            await logAuthEvent("INVALID_LICENSE_KEY", {
              teamMemberId: member.id,
              email,
              description: `License ${license.key} does not belong to ${email}`,
            });
            return null;
          }

          // 6. License is not EXPIRED
          if (license.expiresAt < new Date()) {
            await logAuthEvent("LICENSE_EXPIRED_DENIAL", {
              teamMemberId: member.id,
              email,
              description: `Login denied: license ${license.key} expired on ${license.expiresAt.toISOString()}`,
            });
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "License expired" },
            });
            return null;
          }

          // 7. License is not SUSPENDED
          if (license.status === "SUSPENDED") {
            await logAuthEvent("LICENSE_SUSPENDED_DENIAL", {
              teamMemberId: member.id,
              email,
              description: `Login denied: license ${license.key} is suspended`,
            });
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "License suspended" },
            });
            return null;
          }

          // 8. License is ACTIVE
          if (license.status !== "ACTIVE") {
            await logAuthEvent("LOGIN_FAILURE", {
              teamMemberId: member.id,
              email,
              description: `Login denied: license ${license.key} has status ${license.status}`,
            });
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: `License status: ${license.status}` },
            });
            return null;
          }

          // Reset failed attempts on success
          await prisma.teamMember.update({
            where: { id: member.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLogin: new Date(),
            },
          });

          // Session rotation: expire old sessions, keep only the last 5
          const oldSessions = await prisma.session.findMany({
            where: { teamMemberId: member.id },
            orderBy: { createdAt: "desc" },
            skip: 4,
          });
          if (oldSessions.length > 0) {
            await prisma.session.deleteMany({
              where: { id: { in: oldSessions.map((s) => s.id) } },
            });
          }

          // Create Session record
          const sessionToken = crypto.randomUUID();
          const sessionCreatedAt = new Date();
          const sessionExpiresAt = new Date(sessionCreatedAt.getTime() + AUTH.SESSION_MAX_AGE_SECONDS * 1000);
          const sessionRecord = await prisma.session.create({
            data: {
              teamMemberId: member.id,
              token: sessionToken,
              ipAddress,
              userAgent,
              expiresAt: sessionExpiresAt,
            },
          });

          // Update team member with last login metadata
          await prisma.teamMember.update({
            where: { id: member.id },
            data: {
              lastLoginIp: ipAddress,
              lastUserAgent: userAgent,
            },
          });

          // Create LoginHistory record
          await prisma.loginHistory.create({
            data: {
              teamMemberId: member.id,
              ipAddress,
              userAgent,
              success: true,
            },
          });

          // Create/update activation record for device tracking
          const deviceId = `device-${member.id}-${license.id}`;
          const existingActivation = await prisma.activation.findFirst({
            where: { deviceId },
          });

          const os = userAgent.includes("Windows") ? "Windows"
            : userAgent.includes("Mac") ? "macOS"
            : userAgent.includes("Linux") ? "Linux"
            : userAgent.includes("Android") ? "Android"
            : userAgent.includes("iOS") ? "iOS"
            : "Unknown";
          const osVersion = userAgent.match(/(?:Windows NT |Mac OS X |Android )([\d._]+)/)?.[1]?.replace(/_/g, ".") ?? null;
          const browser = userAgent.includes("Chrome") ? "Chrome"
            : userAgent.includes("Firefox") ? "Firefox"
            : userAgent.includes("Safari") && !userAgent.includes("Chrome") ? "Safari"
            : userAgent.includes("Edge") ? "Edge"
            : "Unknown";
          const browserVersion = userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/([\d.]+)/)?.[1] ?? null;
          const deviceType = userAgent.includes("Mobile") ? "MOBILE"
            : userAgent.includes("Tablet") || userAgent.includes("iPad") ? "TABLET"
            : "DESKTOP";

          const geo = await resolveGeoFromApi(ipAddress);

          if (existingActivation) {
            await prisma.activation.update({
              where: { id: existingActivation.id },
              data: {
                ipAddress,
                os,
                osVersion,
                browser,
                browserVersion,
                deviceType,
                userAgent,
                country: geo.country,
                city: geo.city,
                isp: geo.isp,
                lastSeenAt: new Date(),
                trustScore: Math.min(100, existingActivation.trustScore + 5),
              },
            });
          } else {
            await prisma.activation.create({
              data: {
                deviceId,
                deviceName: `${member.name || member.email}'s ${os} device`,
                licenseId: license.id,
                ipAddress,
                os,
                osVersion,
                browser,
                browserVersion,
                deviceType,
                userAgent,
                country: geo.country,
                city: geo.city,
                isp: geo.isp,
                trustScore: 50,
                status: "ACTIVE",
              },
            });
          }

          const permissions = (await prisma.permission.findMany({
            where: { roleId: member.roleId },
            select: { permission: true },
          })).map((p) => p.permission);

          await logAuthEvent("LOGIN_SUCCESS", {
            teamMemberId: member.id,
            email,
            description: `Login successful for ${email}`,
          });

          return {
            id: member.id,
            email: member.email,
            name: member.name,
            role: member.role.name,
            roleId: member.roleId,
            licenseId: license.id,
            licenseStatus: license.status,
            licensePlan: license.plan,
            permissions,
            sessionRecordId: sessionRecord.id,
            sessionCreatedAt: sessionCreatedAt.toISOString(),
            sessionExpiresAt: sessionExpiresAt.toISOString(),
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Creating a new token on sign-in
        token.id = user.id as string;
        token.role = (user as { role: string }).role;
        token.roleId = (user as { roleId: string }).roleId;
        token.licenseId = (user as { licenseId: string | null }).licenseId;
        token.licenseStatus = (user as { licenseStatus: string | null }).licenseStatus;
        token.licensePlan = (user as { licensePlan: string | null }).licensePlan;
        token.permissions = (user as { permissions: string[] }).permissions;
        token.sessionRecordId = (user as { sessionRecordId: string | null }).sessionRecordId;
        token.sessionCreatedAt = (user as { sessionCreatedAt: string | null }).sessionCreatedAt;
        token.sessionExpiresAt = (user as { sessionExpiresAt: string | null }).sessionExpiresAt;
      } else if (token.licenseId) {
        // Validating license on every token read (each session access)
        try {
          const { prisma } = await import("@/lib/prisma");
          const license = await prisma.license.findUnique({
            where: { id: token.licenseId as string },
            select: { status: true, expiresAt: true },
          });

          if (!license) {
            return null;
          }

          const isExpired = license.expiresAt < new Date();

          if (isExpired || license.status !== "ACTIVE") {
            return null;
          }

          if (token.licenseStatus !== license.status) {
            token.licenseStatus = license.status;
          }
        } catch (e) {
          console.error("License validation error in JWT callback:", e);
        }

        // Server-driven session validation (non-fatal — JWT maxAge handles expiry)
        if (token.sessionRecordId) {
          try {
            const { prisma } = await import("@/lib/prisma");
            const sessionRecord = await prisma.session.findUnique({
              where: { id: token.sessionRecordId as string },
              select: { id: true, createdAt: true, expiresAt: true },
            });

            if (sessionRecord) {
              token.sessionCreatedAt = sessionRecord.createdAt.toISOString();
              token.sessionExpiresAt = sessionRecord.expiresAt.toISOString();
            } else {
              console.warn("JWT callback: sessionRecord not found for id", token.sessionRecordId);
            }
          } catch (e) {
            console.error("Session validation error in JWT callback:", e);
          }
        }
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
      return session;
    },
  },
  events: {
    async signOut(message) {
      if (!("token" in message) || !message.token?.sessionRecordId) return;
      const token = message.token;
      try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.session.update({
          where: { id: token.sessionRecordId as string },
          data: { expiresAt: new Date() },
        }).catch(() => {});
        await prisma.auditLog.create({
          data: {
            action: "LOGOUT",
            actorEmail: (token.email as string) || "unknown",
            actorName: (token.name as string) || null,
            actorRole: (token.role as string) || null,
            entityType: "session",
            entityId: token.sessionRecordId as string,
            description: `User logged out: session ${(token.sessionRecordId as string).slice(0, 12)}...`,
          },
        }).catch(() => {});
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
