import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { DefaultSession } from "next-auth";
import type { Prisma } from "@prisma/client";
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
        const { prisma } = await import("@/lib/prisma");

        const headersList = await import("next/headers").then(m => m.headers());
        const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
          || headersList.get("x-real-ip")
          || "127.0.0.1";
        const userAgent = headersList.get("user-agent") || "Unknown";

        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const licenseKey = String(credentials?.licenseKey ?? "").trim();

        console.log("[AUTH]", JSON.stringify({ step: "start", email, hasPassword: !!password, hasLicenseKey: !!licenseKey }));

        if (!email || !password || !licenseKey) {
          console.log("[AUTH]", JSON.stringify({ step: "missing_fields" }));
          console.log("AUTH_STEP=MISSING_FIELDS", JSON.stringify({ email }));
          return null;
        }

        const ipCheck = checkIpRateLimit(ipAddress);
        if (!ipCheck.allowed) {
          console.log("[AUTH]", JSON.stringify({ step: "ip_blocked", ipAddress, retryAfter: ipCheck.retryAfter }));
          console.log("AUTH_STEP=IP_BLOCKED", JSON.stringify({ email, ipAddress, retryAfter: ipCheck.retryAfter }));
          await logAuthEvent("LOGIN_FAILURE", {
            email,
            description: `Login blocked: IP rate limit exceeded for ${ipAddress}, retry after ${ipCheck.retryAfter}s`,
          });
          return null;
        }

        const bcrypt = await import("bcryptjs");

        // 1. Find user by email
        let member: Prisma.TeamMemberGetPayload<{ include: { role: true; license: true } }> | null;
        try {
          member = await prisma.teamMember.findUnique({
            where: { email },
            include: { role: true, license: true },
          });
        } catch (qErr) {
          console.error("[AUTH] Query failed (find_user):", qErr);
          console.log("AUTH_STEP=QUERY_FAILED", JSON.stringify({ email }));
          return null;
        }

        console.log("[AUTH]", JSON.stringify({ step: "find_user", email, userFound: !!member, memberId: member?.id, memberStatus: member?.status }));

        if (!member) {
          console.log("[AUTH]", JSON.stringify({ step: "no_account" }));
          console.log("AUTH_STEP=EMAIL_LOOKUP", JSON.stringify({ email }));
          await logAuthEvent("LOGIN_FAILURE", {
            email,
            description: `Login failed: no account found for ${email}`,
          });
          try {
            await prisma.loginHistory.create({
              data: { teamMemberId: "unknown", email: email, ipAddress, userAgent, success: false, failureReason: "No account found" },
            });
          } catch (lhErr) {
            console.error("[AUTH] LoginHistory create failed (no_account):", lhErr);
          }
          return null;
        }

        // Check lockout (progressive duration)
        console.log("[AUTH]", JSON.stringify({ step: "lockout_check", lockedUntil: member.lockedUntil?.toISOString(), isLocked: !!(member.lockedUntil && member.lockedUntil > new Date()) }));
        if (member.lockedUntil && member.lockedUntil > new Date()) {
          console.log("[AUTH]", JSON.stringify({ step: "account_locked" }));
          console.log("AUTH_STEP=ACCOUNT_LOCKED", JSON.stringify({ email, memberId: member.id, lockedUntil: member.lockedUntil.toISOString() }));
          await logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id,
            email,
            description: `Login blocked: account locked until ${member.lockedUntil.toISOString()}`,
          });
          return null;
        }

        // 2. Verify password
        console.log("[AUTH]", JSON.stringify({ step: "password_check", hashLen: member.password.length }));
        const isValidPassword = await bcrypt.compare(password, member.password);
          console.log("[AUTH]", JSON.stringify({ step: "password_result", isValidPassword }));
        if (!isValidPassword) {
          console.log("AUTH_STEP=PASSWORD_CHECK", JSON.stringify({ email, memberId: member.id, failedLoginAttempts: member.failedLoginAttempts, bcryptResult: false }));
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
          try {
            await prisma.teamMember.update({ where: { id: member.id }, data: update });
          } catch (uErr) {
            console.error("[AUTH] Update failed (failedLoginAttempts):", uErr);
          }

          try {
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "Invalid password" },
            });
          } catch (lhErr) {
            console.error("[AUTH] LoginHistory create failed (invalid_password):", lhErr);
          }

          await logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id,
            email,
            description: `Login failed: invalid password (attempt ${newAttempts})`,
          });
          return null;
        }

        // 3. Check user has a license assigned
        console.log("[AUTH]", JSON.stringify({ step: "license_assigned", licenseFound: !!member.license, licenseId: member.licenseId }));
        if (!member.license) {
          console.log("[AUTH]", JSON.stringify({ step: "no_license" }));
          console.log("AUTH_STEP=LICENSE_ASSIGNED", JSON.stringify({ email, memberId: member.id, licenseId: member.licenseId }));
          await logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id,
            email,
            description: `Login failed: no license assigned to ${email}`,
          });
          try {
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "No license assigned" },
            });
          } catch (lhErr) {
            console.error("[AUTH] LoginHistory create failed (no_license):", lhErr);
          }
          return null;
        }

        const license = member.license;
        console.log("[AUTH]", JSON.stringify({ step: "license_details", keyInDb: license.key, keySubmitted: licenseKey, expiresAt: license.expiresAt.toISOString(), isExpired: license.expiresAt < new Date(), status: license.status }));

        // 4. License key matches
        if (license.key !== licenseKey) {
          console.log("[AUTH]", JSON.stringify({ step: "license_key_mismatch" }));
          console.log("AUTH_STEP=LICENSE_KEY_MATCH", JSON.stringify({ email, memberId: member.id, licenseId: license.id }));
          await logAuthEvent("INVALID_LICENSE_KEY", {
            teamMemberId: member.id,
            email,
            description: `Login failed: invalid license key provided for ${email}`,
          });
          try {
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "Invalid license key" },
            });
          } catch (lhErr) {
            console.error("[AUTH] LoginHistory create failed (invalid_license_key):", lhErr);
          }
          return null;
        }

        // 5. License belongs to this user
        if (member.licenseId !== license.id) {
          console.log("[AUTH]", JSON.stringify({ step: "license_ownership_mismatch" }));
          console.log("AUTH_STEP=LICENSE_OWNERSHIP", JSON.stringify({ email, memberId: member.id, memberLicenseId: member.licenseId, licenseId: license.id }));
          await logAuthEvent("INVALID_LICENSE_KEY", {
            teamMemberId: member.id,
            email,
            description: `License ${license.key} does not belong to ${email}`,
          });
          return null;
        }

        // 6. License is not EXPIRED
        if (license.expiresAt < new Date()) {
          console.log("[AUTH]", JSON.stringify({ step: "license_expired" }));
          console.log("AUTH_STEP=LICENSE_EXPIRY", JSON.stringify({ email, memberId: member.id, licenseId: license.id, expiresAt: license.expiresAt.toISOString() }));
          await logAuthEvent("LICENSE_EXPIRED_DENIAL", {
            teamMemberId: member.id,
            email,
            description: `Login denied: license ${license.key} expired on ${license.expiresAt.toISOString()}`,
          });
          try {
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "License expired" },
            });
          } catch (lhErr) {
            console.error("[AUTH] LoginHistory create failed (license_expired):", lhErr);
          }
          return null;
        }

        // 7. License is not SUSPENDED
        if (license.status === "SUSPENDED") {
          console.log("[AUTH]", JSON.stringify({ step: "license_suspended" }));
          console.log("AUTH_STEP=LICENSE_STATUS", JSON.stringify({ email, memberId: member.id, licenseId: license.id, status: license.status }));
          await logAuthEvent("LICENSE_SUSPENDED_DENIAL", {
            teamMemberId: member.id,
            email,
            description: `Login denied: license ${license.key} is suspended`,
          });
          try {
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: "License suspended" },
            });
          } catch (lhErr) {
            console.error("[AUTH] LoginHistory create failed (license_suspended):", lhErr);
          }
          return null;
        }

        // 8. License is ACTIVE
        if (license.status !== "ACTIVE") {
          console.log("[AUTH]", JSON.stringify({ step: "license_not_active", status: license.status }));
          console.log("AUTH_STEP=LICENSE_STATUS", JSON.stringify({ email, memberId: member.id, licenseId: license.id, status: license.status }));
          await logAuthEvent("LOGIN_FAILURE", {
            teamMemberId: member.id,
            email,
            description: `Login denied: license ${license.key} has status ${license.status}`,
          });
          try {
            await prisma.loginHistory.create({
              data: { teamMemberId: member.id, ipAddress, userAgent, success: false, failureReason: `License status: ${license.status}` },
            });
          } catch (lhErr) {
            console.error("[AUTH] LoginHistory create failed (license_status):", lhErr);
          }
          return null;
        }

        console.log("[AUTH]", JSON.stringify({ step: "all_checks_passed" }));

        // ---- Post-auth operations (isolated failures cannot block login) ----

        // Reset failed attempts on success
        try {
          await prisma.teamMember.update({
            where: { id: member.id },
            data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
          });
        } catch (opErr) {
          console.error("[AUTH] Post-auth operation failed (reset_attempts):", opErr);
        }

        // Session rotation: keep last 5
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
        } catch (opErr) {
          console.error("[AUTH] Post-auth operation failed (session_rotation):", opErr);
        }

        // Create Session record
        const sessionToken = crypto.randomUUID();
        const sessionCreatedAt = new Date();
        const sessionExpiresAt = new Date(sessionCreatedAt.getTime() + AUTH.SESSION_MAX_AGE_SECONDS * 1000);
        let sessionRecordId: string | null = null;
        try {
          const sessionRecord = await prisma.session.create({
            data: {
              teamMemberId: member.id,
              token: sessionToken,
              ipAddress,
              userAgent,
              expiresAt: sessionExpiresAt,
            },
          });
          sessionRecordId = sessionRecord.id;
        } catch (opErr) {
          console.error("[AUTH] Post-auth operation failed (session_create):", opErr);
        }

        // Update last login metadata
        try {
          await prisma.teamMember.update({
            where: { id: member.id },
            data: { lastLoginIp: ipAddress, lastUserAgent: userAgent },
          });
        } catch (opErr) {
          console.error("[AUTH] Post-auth operation failed (last_login_meta):", opErr);
        }

        // Create LoginHistory record
        try {
          await prisma.loginHistory.create({
            data: { teamMemberId: member.id, ipAddress, userAgent, success: true },
          });
        } catch (lhErr) {
          console.error("[AUTH] LoginHistory create failed (success):", lhErr);
        }

        // Device activation tracking
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
        } catch (opErr) {
          console.error("[AUTH] Post-auth operation failed (activation):", opErr);
        }

        // Load permissions
        let permissions: string[] = [];
        try {
          permissions = (await prisma.permission.findMany({
            where: { roleId: member.roleId },
            select: { permission: true },
          })).map(p => p.permission);
        } catch (opErr) {
          console.error("[AUTH] Post-auth operation failed (permissions):", opErr);
        }

        await logAuthEvent("LOGIN_SUCCESS", {
          teamMemberId: member.id,
          email,
          description: `Login successful for ${email}`,
        });

        console.log("[AUTH]", JSON.stringify({ step: "return_success", memberId: member.id, email, role: member.role?.name ?? null, roleId: member.roleId }));

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
