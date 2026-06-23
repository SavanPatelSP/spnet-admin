import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getLicenseCounts = cache(async () => {
  return prisma.license.findMany({
    select: { status: true, expiresAt: true, maxDevices: true, plan: true, organization: true },
  });
});

export const getActivationCounts = cache(async () => {
  return prisma.activation.groupBy({ by: ["status"], _count: true });
});

export const getMemberCounts = cache(async () => {
  return prisma.teamMember.groupBy({ by: ["status"], _count: true });
});

export const getRoleCount = cache(async () => {
  return prisma.role.count();
});

export const getCoinAggregates = cache(async () => {
  return prisma.coinBalance.aggregate({ _sum: { balance: true }, _count: true });
});

export const getGemAggregates = cache(async () => {
  return prisma.gemBalance.aggregate({ _sum: { balance: true }, _count: true });
});

export const getActivePromotionCount = cache(async () => {
  return prisma.promotion.count({ where: { active: true } });
});

export const getInvoiceAggregates = cache(async () => {
  return prisma.invoice.aggregate({ _sum: { total: true }, _count: true });
});

export const getInvoiceCountsByStatus = cache(async () => {
  return prisma.invoice.groupBy({ by: ["status"], _count: true });
});

export const getActiveSessionCount = cache(async () => {
  return prisma.session.count({ where: { expiresAt: { gt: new Date() } } });
});

export const getRecentAuditLogs = cache(async (take = 5) => {
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take });
});

export const getPermissionsByRoleId = cache(async (roleId: string) => {
  return prisma.permission.findMany({
    where: { roleId },
    select: { permission: true },
  });
});
