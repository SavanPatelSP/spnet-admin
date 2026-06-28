import { prisma } from "@/lib/prisma";

export async function logAuthEvent(
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
