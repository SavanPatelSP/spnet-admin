import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { DefaultSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
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
    licenseLastVerifiedAt: string | null;
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
        const t0 = Date.now();

        const headersList = await headers();
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
          logAuthEvent("LOGIN_FAILURE", {
            email,
            description: `Login blocked: IP rate limit exceeded for ${ipAddress}, retry after ${ipCheck.retryAfter}s`,
          });
          return null;
        }

        // 1. Find user by email
        let member: Prisma.TeamMemberGetPayload<{ include: { role: true; license: true } }> | null;
        try {
          member = await prisma.teamMember.findUnique({
            where: { email },
            include: { role: true, license: true },
          });
        } catch {
          return null;
        }

        if (!member) {
          logAuthEvent("LOGIN_FAILURE", {
            email,
            description: `Login failed: no account found for ${email}`,
          });
          prisma.loginHistory.create({
            data: { teamMemberId: "unknown", email: email, ipAddress, userAgent, success: false, failureReason: "No account found" },
          }).catch(() => {});
          return null;
        }

        if (member.lockedUntil && member.lockedUntil > new Date()) {
          logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id,
            email,
            description: `Login blocked: account locked until ${member.lockedUntil.toISOString()}`,
          });
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, member.password);
        if (!isValidPassword) {
          const newAttempts = member.failedLoginAttempts + 1;
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
          prisma.teamMember.update({ where: { id: member.id }, data: update }).catch(() => {});

          prisma.loginHistory.create({
            data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "Invalid password" },
          }).catch(() => {});

          logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id,
            email,
            description: `Login failed: invalid password (attempt ${newAttempts})`,
          });
          return null;
        }

        if (!member.license) {
          logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id,
            email,
            description: `Login failed: no license assigned to ${email}`,
          });
          prisma.loginHistory.create({
            data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "No license assigned" },
          }).catch(() => {});
          return null;
        }

        const license = member.license;

        if (license.key !== licenseKey) {
          logAuthEvent("INVALID_LICENSE_KEY", {
            teamMemberId: member.id,
            email,
            description: `Login failed: invalid license key provided for ${email}`,
          });
          prisma.loginHistory.create({
            data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "Invalid license key" },
          }).catch(() => {});
          return null;
        }

        if (member.licenseId !== license.id) {
          logAuthEvent("INVALID_LICENSE_KEY", {
            teamMemberId: member.id,
            email,
            description: `License ${license.key} does not belong to ${email}`,
          });
          return null;
        }

        if (license.expiresAt < new Date()) {
          logAuthEvent("LICENSE_EXPIRED_DENIAL", {
            teamMemberId: member.id,
            email,
            description: `Login denied: license ${license.key} expired on ${license.expiresAt.toISOString()}`,
          });
          prisma.loginHistory.create({
            data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "License expired" },
          }).catch(() => {});
          return null;
        }

        if (license.status === "SUSPENDED") {
          logAuthEvent("LICENSE_SUSPENDED_DENIAL", {
            teamMemberId: member.id,
            email,
            description: `Login denied: license ${license.key} is suspended`,
          });
          prisma.loginHistory.create({
            data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "License suspended" },
          }).catch(() => {});
          return null;
        }

        if (license.status !== "ACTIVE") {
          logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id,
            email,
            description: `Login denied: license ${license.key} has status ${license.status}`,
          });
          prisma.loginHistory.create({
            data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: `License status: ${license.status}` },
          }).catch(() => {});
          return null;
        }

        // ── Critical path (must complete before return) ──

        // Session + permissions are independent — run in parallel
        const tParallel = Date.now();
        const sessionToken = crypto.randomUUID();
        const sessionCreatedAt = new Date();
        const sessionExpiresAt = new Date(sessionCreatedAt.getTime() + AUTH.SESSION_MAX_AGE_SECONDS * 1000);
        let sessionRecordId: string | null = null;
        let permissions: string[] = [];
        try {
          const [sessionRecord, permissionRows] = await Promise.all([
            prisma.session.create({
              data: {
                teamMemberId: member.id,
                token: sessionToken,
                ipAddress,
                userAgent,
                expiresAt: sessionExpiresAt,
              },
            }),
            prisma.permission.findMany({
              where: { roleId: member.roleId },
              select: { permission: true },
            }),
          ]);
          sessionRecordId = sessionRecord.id;
          permissions = permissionRows.map(p => p.permission);
        } catch {
          // Session/permission query failed — null return will prevent login
        }

        // ── Non-critical operations (fire-and-forget) ──
        (async () => {
          try {
            await prisma.teamMember.update({
              where: { id: member.id },
              data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date(), lastLoginIp: ipAddress, lastUserAgent: userAgent },
            });
          } catch {}
          try {
            const oldSessions = await prisma.session.findMany({
              where: { teamMemberId: member.id },
              orderBy: { createdAt: "desc" },
              skip: 4,
            });
            if (oldSessions.length > 0) {
              await prisma.session.deleteMany({
                where: { id: { in: oldSessions.map(s => s.id) } },
              });
            }
          } catch {}
          try {
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: true },
            });
          } catch {}
          try {
            const deviceId = `device-${member.id}-${license.id}`;
            const existingActivation = await prisma.activation.findFirst({ where: { deviceId } });
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
                  ipAddress, os, osVersion, browser, browserVersion, deviceType, userAgent,
                  country: geo.country, city: geo.city, isp: geo.isp,
                  lastSeenAt: new Date(),
                  trustScore: Math.min(100, existingActivation.trustScore + 5),
                },
              });
            } else {
              await prisma.activation.create({
                data: {
                  deviceId,
                  deviceName: `${member.name || member.email}'s ${os} device`,
                  licenseId: license.id, ipAddress, os, osVersion, browser, browserVersion,
                  deviceType, userAgent,
                  country: geo.country, city: geo.city, isp: geo.isp,
                  trustScore: 50, status: "ACTIVE",
                },
              });
            }
          } catch {}
          logAuthEvent("LOGIN_SUCCESS", {
            teamMemberId: member.id,
            email,
            description: `Login successful for ${email}`,
          });
        })();

        return {
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role?.name ?? "Unknown",
          roleId: member.roleId,
          licenseId: license.id,
          licenseStatus: license.status,
          licensePlan: license.plan,
          permissions,
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
        token.licenseLastVerifiedAt = new Date().toISOString();
      } else if (token.licenseId) {
        // License re-validation with 5-minute cache window
        const LICENSE_REFRESH_MS = 5 * 60 * 1000;
        const lastVerified = token.licenseLastVerifiedAt
          ? new Date(token.licenseLastVerifiedAt).getTime()
          : 0;
        if (Date.now() - lastVerified > LICENSE_REFRESH_MS) {
          try {
            const license = await prisma.license.findUnique({
              where: { id: token.licenseId as string },
              select: { status: true, expiresAt: true },
            });
            if (!license) return null;
            if (license.expiresAt < new Date() || license.status !== "ACTIVE") return null;
            if (token.licenseStatus !== license.status) {
              token.licenseStatus = license.status;
            }
            token.licenseLastVerifiedAt = new Date().toISOString();
          } catch (e) {
            console.error("License validation error in JWT callback:", e);
          }
        }

        // Server-driven session expiry check (no DB query — trust JWT maxAge)
        // The SessionCountdown component polls /api/sessions/me every 30s for fresh data.
        // The JWT's own maxAge is the authoritative session expiry.
        if (token.sessionExpiresAt && new Date(token.sessionExpiresAt) < new Date()) {
          return null;
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
