import { prisma } from "@/lib/prisma";

export async function logAudit(
  action: string,
  licenseId?: string,
  organization?: string,
  actorRole?: string,
  actorName?: string,
  description?: string
) {
  await prisma.auditLog.create({
    data: {
      action,
      licenseId,
      organization,
      actorRole,
      actorName,
      description,
    },
  });
}
