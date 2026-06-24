import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

function computeHash(data: { action: string; entityType?: string | null; entityId?: string | null; timestamp: Date; previousHash?: string | null }): string {
  const input = `${data.action}|${data.entityType || ""}|${data.entityId || ""}|${data.timestamp.toISOString()}|${data.previousHash || ""}`;
  return createHash("sha256").update(input).digest("hex");
}

export async function addAuditChainLink(params: {
  auditLogId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  timestamp: Date;
}) {
  const lastLink = await prisma.auditChainLink.findFirst({
    orderBy: { chainIndex: "desc" },
  });

  const previousHash = lastLink?.auditHash || null;
  const chainIndex = lastLink ? lastLink.chainIndex + 1 : 0;
  const auditHash = computeHash({
    ...params,
    previousHash,
  });

  return prisma.auditChainLink.create({
    data: {
      auditLogId: params.auditLogId,
      auditHash,
      previousHash,
      chainIndex,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      timestamp: params.timestamp,
      integrityStatus: "VERIFIED",
    },
  });
}

export async function verifyChainIntegrity() {
  const links = await prisma.auditChainLink.findMany({
    orderBy: { chainIndex: "asc" },
  });

  const results: {
    id: string;
    chainIndex: number;
    status: "VERIFIED" | "TAMPERED" | "MISSING_PREVIOUS";
    expectedHash: string;
    actualHash: string;
  }[] = [];

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const previousHash = i > 0 ? links[i - 1].auditHash : null;

    const expectedHash = computeHash({
      action: link.action,
      entityType: link.entityType,
      entityId: link.entityId,
      timestamp: link.timestamp,
      previousHash,
    });

    const isMissingPrevious = i > 0 && link.previousHash !== links[i - 1].auditHash;

    let status: "VERIFIED" | "TAMPERED" | "MISSING_PREVIOUS" = "VERIFIED";
    if (link.auditHash !== expectedHash) {
      status = "TAMPERED";
    } else if (isMissingPrevious) {
      status = "MISSING_PREVIOUS";
    }

    results.push({
      id: link.id,
      chainIndex: link.chainIndex,
      status,
      expectedHash,
      actualHash: link.auditHash,
    });

    // Update integrity status
    if (status !== "VERIFIED") {
      await prisma.auditChainLink.update({
        where: { id: link.id },
        data: { integrityStatus: status },
      });
    }
  }

  const tampered = results.filter(r => r.status !== "VERIFIED").length;
  return {
    total: results.length,
    verified: results.filter(r => r.status === "VERIFIED").length,
    tampered: tampered,
    results,
    chainIntact: tampered === 0,
  };
}

export async function getChainStats() {
  const [total, verified, tampered, lastIndex] = await Promise.all([
    prisma.auditChainLink.count(),
    prisma.auditChainLink.count({ where: { integrityStatus: "VERIFIED" } }),
    prisma.auditChainLink.count({ where: { integrityStatus: { not: "VERIFIED" } } }),
    prisma.auditChainLink.findFirst({ orderBy: { chainIndex: "desc" }, select: { chainIndex: true } }),
  ]);
  return {
    total,
    verified,
    tampered,
    chainLength: lastIndex?.chainIndex ?? 0,
    integrity: tampered === 0 ? "INTACT" : "COMPROMISED",
  };
}

export async function getAuditLogWithChain(auditLogId: string) {
  return prisma.auditChainLink.findUnique({
    where: { auditLogId },
  });
}
