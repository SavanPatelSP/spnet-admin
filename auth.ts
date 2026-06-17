import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { DefaultSession } from "next-auth";
import { AUTH } from "@/lib/constants";

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
      async authorize(credentials) {
        try {
          const { prisma } = await import("@/lib/prisma");

          const email = String(credentials?.email ?? "").trim().toLowerCase();
          const password = String(credentials?.password ?? "");
          const licenseKey = String(credentials?.licenseKey ?? "").trim();

          if (!email || !password || !licenseKey) {
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
            return null;
          }

          // Check lockout
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
            const update: {
              failedLoginAttempts: number;
              lockedUntil?: Date;
            } = {
              failedLoginAttempts: newAttempts,
            };
            if (newAttempts >= AUTH.MAX_LOGIN_ATTEMPTS) {
              update.lockedUntil = new Date(
                Date.now() + AUTH.LOCKOUT_DURATION_MINUTES * 60 * 1000
              );
              update.failedLoginAttempts = 0;
            }
            await prisma.teamMember.update({
              where: { id: member.id },
              data: update,
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
            return null;
          }

          // 5. License belongs to this user (enforced by DB relation, double-check)
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
            return null;
          }

          // 7. License is not SUSPENDED
          if (license.status === "SUSPENDED") {
            await logAuthEvent("LICENSE_SUSPENDED_DENIAL", {
              teamMemberId: member.id,
              email,
              description: `Login denied: license ${license.key} is suspended`,
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
        } catch {
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
      return session;
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
