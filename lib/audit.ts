import { prisma } from "@/lib/prisma";

export async function logAudit(
  action: string,
  licenseId?: string | null,
  organization?: string | null,
  actorRole?: string | null,
  actorName?: string | null,
  description?: string | null,
  actorEmail?: string | null
) {
  await prisma.auditLog.create({
    data: {
      action,
      licenseId,
      organization,
      actorRole,
      actorName,
      description,
      actorEmail,
    },
  });
}
