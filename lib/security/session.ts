import { prisma } from "@/lib/prisma";

export interface SessionInfo {
  id: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export async function createSession(
  teamMemberId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<SessionInfo> {
  const session = await prisma.session.create({
    data: {
      teamMemberId,
      token,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt: new Date(Date.now() + 86400 * 1000),
    },
  });

  prisma.auditLog.create({
    data: {
      action: "SESSION_CREATED",
      entityId: session.id,
      entityType: "session",
      actorEmail: "system",
      description: `Session created for team member ${teamMemberId}`,
    },
  }).catch(() => {});

  return session;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export async function revokeAllSessions(teamMemberId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { teamMemberId } });
}

export async function listSessions(teamMemberId: string): Promise<SessionInfo[]> {
  return prisma.session.findMany({
    where: { teamMemberId },
    orderBy: { createdAt: "desc" },
  });
}

export async function validateSession(sessionId: string): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return false;
    if (session.expiresAt < new Date()) {
      await revokeSession(sessionId);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getSecureCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}
