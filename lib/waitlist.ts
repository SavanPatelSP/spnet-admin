import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

async function getNextPosition(): Promise<number> {
  const last = await prisma.waitlistEntry.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return (last?.position ?? 0) + 1;
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function addWaitlistEntry(data: {
  fullName: string;
  email: string;
  country?: string;
  referralCode?: string;
  interestCategory?: string;
}) {
  const position = await getNextPosition();
  const ownReferralCode = generateReferralCode();

  const entry = await prisma.waitlistEntry.create({
    data: {
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      country: data.country,
      referralCode: data.referralCode,
      interestCategory: data.interestCategory,
      position,
      ownReferralCode,
      status: "PENDING",
    },
  });

  // If someone referred this user, increment their referral count
  if (data.referralCode) {
    const referrer = await prisma.waitlistEntry.findUnique({
      where: { ownReferralCode: data.referralCode },
    });
    if (referrer) {
      await prisma.waitlistEntry.update({
        where: { id: referrer.id },
        data: { referralCount: { increment: 1 } },
      });
      await recalculateReferralRanks();
    }
  }

  return entry;
}

async function recalculateReferralRanks() {
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { referralCount: "desc" },
    select: { id: true },
  });
  for (let i = 0; i < entries.length; i++) {
    await prisma.waitlistEntry.update({
      where: { id: entries[i].id },
      data: { referralRank: i + 1 },
    });
  }
}

export async function getWaitlistStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, today, thisWeek, thisMonth, statusCounts, totalReferrals, converted] = await Promise.all([
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.waitlistEntry.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.waitlistEntry.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.waitlistEntry.groupBy({ by: ["status"], _count: true }),
    prisma.waitlistEntry.aggregate({ _sum: { referralCount: true } }),
    prisma.waitlistEntry.count({ where: { status: "CONVERTED" } }),
  ]);

  const conversionRate = total > 0 ? (converted / total) * 100 : 0;
  const totalReferralCount = totalReferrals._sum.referralCount || 0;
  const referralRate = total > 0 ? (totalReferralCount / total) * 100 : 0;

  return {
    total,
    today,
    thisWeek,
    thisMonth,
    conversionRate: Math.round(conversionRate * 100) / 100,
    referralRate: Math.round(referralRate * 100) / 100,
    statusCounts,
    converted,
    totalReferralCount,
  };
}

export async function getWaitlistEntries(options: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const where: Prisma.WaitlistEntryWhereInput = {};
  if (options.status) where.status = options.status;
  if (options.search) {
    where.OR = [
      { fullName: { contains: options.search } },
      { email: { contains: options.search } },
    ];
  }

  const [entries, total] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where,
      orderBy: { position: "asc" },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.waitlistEntry.count({ where }),
  ]);
  return { entries, total };
}

export async function getWaitlistAnalytics() {
  const [countryDistribution, referralLeaders, signupTrends] = await Promise.all([
    prisma.waitlistEntry.groupBy({
      by: ["country"],
      _count: true,
      orderBy: { _count: { country: "desc" } },
    }),
    prisma.waitlistEntry.findMany({
      orderBy: { referralCount: "desc" },
      take: 10,
      select: { fullName: true, email: true, referralCount: true, referralRank: true },
    }),
    prisma.waitlistEntry.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  return { countryDistribution, referralLeaders, signupTrends };
}

export async function updateWaitlistEntryStatus(
  id: string,
  status: string,
  userId?: string,
) {
  const data: Prisma.WaitlistEntryUpdateInput = { status };
  if (status === "APPROVED") {
    data.approvedAt = new Date();
    data.approvedBy = userId;
  } else if (status === "CONVERTED") {
    data.convertedAt = new Date();
    data.convertedUserId = userId;
  } else if (status === "INVITED") {
    data.inviteSentAt = new Date();
    data.invitedBy = userId;
  }
  return prisma.waitlistEntry.update({
    where: { id },
    data,
  });
}

export async function createInviteCode(data: {
  maxUses?: number;
  createdBy?: string;
  expiresAt?: Date;
}) {
  const code = `WAITLIST-${randomBytes(3).toString("hex").toUpperCase()}`;
  return prisma.waitlistInviteCode.create({
    data: {
      code,
      maxUses: data.maxUses || 1,
      createdBy: data.createdBy,
      expiresAt: data.expiresAt,
    },
  });
}

export async function getInviteCodes() {
  return prisma.waitlistInviteCode.findMany({
    orderBy: { createdAt: "desc" },
  });
}
