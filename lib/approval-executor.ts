import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { generateKey, parseExpiryDate } from "@/lib/shared";
import { DEFAULT_PLAN, DEFAULT_MAX_DEVICES, AUDIT_ACTIONS, PREMIUM_PLANS, ADMIN_SUBSCRIPTION_TYPES, PLAN_PRICES, DEFAULT_EXPIRY_YEAR } from "@/lib/constants";
import { createInvoiceForLicense, createInvoiceForPremium, createInvoice } from "@/lib/invoices";
import { getCoinPackage } from "@/lib/economy-pricing";
import bcrypt from "bcryptjs";

interface ExecutorContext {
  approvedBy: string;
  approvedByName: string;
  approvedByEmail: string;
}

type Executor = (payload: Record<string, unknown>, ctx: ExecutorContext) => Promise<{ success: boolean; message: string; data?: unknown }>;

async function executeLicenseCreate(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const org = payload.organization as string;
  const plan = (payload.plan as string) || DEFAULT_PLAN;
  const status = (payload.status as string) || "ACTIVE";
  const maxDevices = Number(payload.maxDevices) || DEFAULT_MAX_DEVICES;
  const notes = (payload.notes as string) || "";
  const expiresAt = payload.expiresAt ? parseExpiryDate(payload.expiresAt as string) : new Date(DEFAULT_EXPIRY_YEAR, 11, 31, 12, 0, 0);

  const license = await prisma.license.create({
    data: { key: generateKey(), organization: org, plan, status, maxDevices, expiresAt, notes },
  });

  await logAudit(AUDIT_ACTIONS.LICENSE_CREATED, license.id, license.organization, ctx.approvedBy, ctx.approvedByName, `Created ${license.plan} license for ${license.organization}`, ctx.approvedByEmail);

  try {
    const price = PLAN_PRICES[plan] ?? 0;
    if (price > 0) await createInvoiceForLicense(license.id, plan, price);
  } catch {}

  return { success: true, message: "License created", data: license };
}

async function executeLicenseBulkCreate(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const count = Number(payload.count) || 1;
  const org = payload.organization as string;
  const plan = (payload.plan as string) || DEFAULT_PLAN;
  const maxDevices = Number(payload.maxDevices) || DEFAULT_MAX_DEVICES;
  const notes = (payload.notes as string) || "";
  const expiresAt = payload.expiresAt ? parseExpiryDate(payload.expiresAt as string) : new Date(DEFAULT_EXPIRY_YEAR, 11, 31, 12, 0, 0);

  const licensesData = Array.from({ length: count }, () => ({
    key: generateKey(), organization: org, plan, status: "ACTIVE" as const, maxDevices, expiresAt, notes,
  }));

  await prisma.license.createMany({ data: licensesData });
  await logAudit(AUDIT_ACTIONS.LICENSE_CREATED, undefined, org, ctx.approvedBy, ctx.approvedByName, `Bulk created ${count} licenses for ${org}`, ctx.approvedByEmail);

  return { success: true, message: `${count} licenses created` };
}

async function executeLicenseTransfer(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const newOrg = payload.newOrganization as string;

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const updated = await prisma.license.update({ where: { id: licenseId }, data: { organization: newOrg, parentLicenseId: licenseId } });
  await prisma.licenseEvent.create({ data: { licenseId, type: "TRANSFERRED", description: `Transferred from ${license.organization} to ${newOrg}`, performedBy: ctx.approvedByName } });
  await logAudit(AUDIT_ACTIONS.LICENSE_TRANSFERRED, licenseId, newOrg, ctx.approvedBy, ctx.approvedByName, `Transferred license from ${license.organization} to ${newOrg}`, ctx.approvedByEmail);

  return { success: true, message: "License transferred", data: updated };
}

async function executeRegenerateKey(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const newKey = generateKey();

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  await prisma.licenseEvent.create({ data: { licenseId, type: "KEY_REGENERATED", description: `License key regenerated`, performedBy: ctx.approvedByName } });
  const updated = await prisma.license.update({ where: { id: licenseId }, data: { key: newKey } });
  await logAudit(AUDIT_ACTIONS.LICENSE_KEY_REGENERATED, licenseId, license.organization, ctx.approvedBy, ctx.approvedByName, `Regenerated license key for ${license.organization}`, ctx.approvedByEmail);

  return { success: true, message: "License key regenerated", data: updated };
}

async function executePremiumGrant(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const plan = payload.plan as string;
  const durationDays = payload.durationDays as number || 365;
  const subType = (payload.subscriptionType as string) || "MONTHLY";
  const notes = payload.notes as string;
  if (!PREMIUM_PLANS.some(p => p === plan)) return { success: false, message: `Invalid premium plan` };

  if (!ADMIN_SUBSCRIPTION_TYPES.some(s => s === subType)) return { success: false, message: `Invalid subscription type` };

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };
  if (PREMIUM_PLANS.some(p => p === license.plan)) return { success: false, message: "License is already on a premium plan" };

  const isLifetime = subType === "LIFETIME";
  const startDate = new Date();
  const endDate = isLifetime ? new Date("2099-12-31") : new Date(startDate.getTime() + Number(durationDays) * 86400000);

  const subscription = await prisma.premiumSubscription.create({
    data: { licenseId, plan, subscriptionType: subType, action: "GRANTED", startDate, endDate, durationDays: isLifetime ? null : Number(durationDays), grantedBy: ctx.approvedByName, notes: notes || null, previousPlan: license.plan, previousEndDate: license.expiresAt },
  });

  await prisma.license.update({ where: { id: licenseId }, data: { plan, expiresAt: endDate } });
  await logAudit(AUDIT_ACTIONS.PREMIUM_GRANTED, license.id, license.organization, ctx.approvedBy, ctx.approvedByName, `Granted ${plan} premium for ${license.organization} (${subType})`, ctx.approvedByEmail);

  try { const price = PLAN_PRICES[plan] ?? 0; if (price > 0) await createInvoiceForPremium(licenseId, plan, price, subscription.id); } catch {}

  return { success: true, message: "Premium granted", data: subscription };
}

async function executePremiumExtend(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const extraDays = Number(payload.days) || 30;

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const newExpiry = new Date(license.expiresAt.getTime() + extraDays * 86400000);
  await prisma.license.update({ where: { id: licenseId }, data: { expiresAt: newExpiry } });

  const subscription = await prisma.premiumSubscription.create({
    data: { licenseId, plan: license.plan, subscriptionType: "CUSTOM", action: "EXTENDED", startDate: new Date(), endDate: newExpiry, durationDays: extraDays, grantedBy: ctx.approvedByName },
  });

  await logAudit(AUDIT_ACTIONS.PREMIUM_EXTENDED, licenseId, license.organization, ctx.approvedBy, ctx.approvedByName, `Extended premium for ${license.organization} by ${extraDays} days`, ctx.approvedByEmail);

  return { success: true, message: "Premium extended", data: subscription };
}

async function executePremiumPlanChange(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const newPlan = payload.plan as string;

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };
  if (!PREMIUM_PLANS.some(p => p === newPlan)) return { success: false, message: `Invalid premium plan` };

  await prisma.license.update({ where: { id: licenseId }, data: { plan: newPlan } });

  const subscription = await prisma.premiumSubscription.create({
    data: { licenseId, plan: newPlan, subscriptionType: "CUSTOM", action: "PLAN_CHANGED", startDate: new Date(), endDate: license.expiresAt, grantedBy: ctx.approvedByName, previousPlan: license.plan },
  });

  await logAudit(AUDIT_ACTIONS.PREMIUM_PLAN_CHANGED, licenseId, license.organization, ctx.approvedBy, ctx.approvedByName, `Changed ${license.organization} plan from ${license.plan} to ${newPlan}`, ctx.approvedByEmail);

  return { success: true, message: "Plan changed", data: subscription };
}

async function executePremiumDowngrade(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const newPlan = payload.plan as string;

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  await prisma.license.update({ where: { id: licenseId }, data: { plan: newPlan } });

  const subscription = await prisma.premiumSubscription.create({
    data: { licenseId, plan: newPlan, subscriptionType: "CUSTOM", action: "DOWNGRADED", startDate: new Date(), endDate: license.expiresAt, grantedBy: ctx.approvedByName, previousPlan: license.plan },
  });

  await logAudit(AUDIT_ACTIONS.PREMIUM_DOWNGRADED, licenseId, license.organization, ctx.approvedBy, ctx.approvedByName, `Downgraded ${license.organization} from ${license.plan} to ${newPlan}`, ctx.approvedByEmail);

  return { success: true, message: "Premium downgraded", data: subscription };
}

async function executePremiumConvertLifetime(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const endDate = new Date("2099-12-31");
  await prisma.license.update({ where: { id: licenseId }, data: { expiresAt: endDate } });

  const subscription = await prisma.premiumSubscription.create({
    data: { licenseId, plan: license.plan, subscriptionType: "LIFETIME", action: "CONVERTED_TO_LIFETIME", startDate: new Date(), endDate, grantedBy: ctx.approvedByName, previousPlan: license.plan },
  });

  await logAudit(AUDIT_ACTIONS.PREMIUM_LIFETIME_CONVERTED, licenseId, license.organization, ctx.approvedBy, ctx.approvedByName, `Converted ${license.organization} to lifetime`, ctx.approvedByEmail);

  return { success: true, message: "Converted to lifetime", data: subscription };
}

async function executePremiumConvertCustom(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const plan = payload.plan as string;
  const durationDays = Number(payload.durationDays) || 365;

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const endDate = new Date(Date.now() + durationDays * 86400000);
  await prisma.license.update({ where: { id: licenseId }, data: { plan: plan || license.plan, expiresAt: endDate } });

  const subscription = await prisma.premiumSubscription.create({
    data: { licenseId, plan: plan || license.plan, subscriptionType: "CUSTOM", action: "CONVERTED_TO_CUSTOM", startDate: new Date(), endDate, durationDays, grantedBy: ctx.approvedByName, previousPlan: license.plan },
  });

  await logAudit(AUDIT_ACTIONS.PREMIUM_CONVERTED_TO_CUSTOM, licenseId, license.organization, ctx.approvedBy, ctx.approvedByName, `Converted ${license.organization} to custom (${durationDays}d)`, ctx.approvedByEmail);

  return { success: true, message: "Converted to custom", data: subscription };
}

async function executeCoinsGrant(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const amount = Number(payload.amount);
  const type = (payload.type as string) || "FINITE";
  const reason = (payload.reason as string) || "Granted coins";
  const description = payload.description as string;

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const result = await prisma.$transaction(async (tx) => {
    const balance = await tx.coinBalance.upsert({
      where: { licenseId }, create: { licenseId, balance: amount, type }, update: { balance: { increment: amount }, ...(type ? { type } : {}) },
    });
    const transaction = await tx.coinTransaction.create({
      data: { licenseId, type: "CREDIT", amount, balanceAfter: balance.balance, reason: reason + (type ? ` (${type})` : ""), description, performedBy: ctx.approvedByName },
    });
    return { balance, transaction };
  });

  await logAudit(AUDIT_ACTIONS.COINS_BULK_GRANTED, license.id, license.organization, ctx.approvedBy, ctx.approvedByName, `Granted ${amount} coins to ${license.organization}`, ctx.approvedByEmail);

  try { const coinPkg = getCoinPackage(type || "STARTER"); const price = coinPkg ? (amount / coinPkg.amount) * coinPkg.price : 0; if (price > 0) await createInvoice({ licenseId, category: "COIN", action: "GRANT", status: "PENDING", type: "SALE", subtotal: price, lineItems: [{ description: `Coins grant — ${amount} coins${type ? ` (${type})` : ""}`, quantity: 1, unitPrice: Math.round(price * 100), total: Math.round(price * 100) }], dueDays: 30, notes: `Auto-generated invoice for granting ${amount} coins.`, relatedEntityType: "COIN_GRANT", relatedEntityId: licenseId }); } catch {}

  return { success: true, message: "Coins granted", data: result };
}

async function executeCoinsRemove(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const amount = Number(payload.amount);

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const result = await prisma.$transaction(async (tx) => {
    const balance = await tx.coinBalance.findUnique({ where: { licenseId } });
    if (!balance) throw new Error("No coin balance found");
    const newBalance = Math.max(0, balance.balance - amount);
    const updated = await tx.coinBalance.update({ where: { licenseId }, data: { balance: newBalance } });
    const transaction = await tx.coinTransaction.create({ data: { licenseId, type: "DEBIT", amount, balanceAfter: newBalance, reason: (payload.reason as string) || "Removed coins", performedBy: ctx.approvedByName } });
    return { balance: updated, transaction };
  });

  await logAudit(AUDIT_ACTIONS.COINS_REMOVED, license.id, license.organization, ctx.approvedBy, ctx.approvedByName, `Removed ${amount} coins from ${license.organization}`, ctx.approvedByEmail);

  return { success: true, message: "Coins removed", data: result };
}

async function executeCoinsSet(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const amount = Number(payload.amount);

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const balance = await prisma.coinBalance.upsert({
    where: { licenseId }, create: { licenseId, balance: amount, type: "FINITE" }, update: { balance: amount },
  });

  await logAudit(AUDIT_ACTIONS.COINS_SET, license.id, license.organization, ctx.approvedBy, ctx.approvedByName, `Set ${license.organization} coin balance to ${amount}`, ctx.approvedByEmail);

  return { success: true, message: "Coin balance set", data: balance };
}

async function executeGemsGrant(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const amount = Number(payload.amount);

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const result = await prisma.$transaction(async (tx) => {
    const balance = await tx.gemBalance.upsert({ where: { licenseId }, create: { licenseId, balance: amount }, update: { balance: { increment: amount } } });
    const transaction = await tx.gemTransaction.create({ data: { licenseId, type: "CREDIT", amount, balanceAfter: balance.balance, reason: (payload.reason as string) || "Granted gems", performedBy: ctx.approvedByName } });
    return { balance, transaction };
  });

  await logAudit(AUDIT_ACTIONS.GEMS_GRANTED, license.id, license.organization, ctx.approvedBy, ctx.approvedByName, `Granted ${amount} gems to ${license.organization}`, ctx.approvedByEmail);

  return { success: true, message: "Gems granted", data: result };
}

async function executeGemsRemove(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const amount = Number(payload.amount);

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const result = await prisma.$transaction(async (tx) => {
    const balance = await tx.gemBalance.findUnique({ where: { licenseId } });
    if (!balance) throw new Error("No gem balance found");
    const newBalance = Math.max(0, balance.balance - amount);
    const updated = await tx.gemBalance.update({ where: { licenseId }, data: { balance: newBalance } });
    const transaction = await tx.gemTransaction.create({ data: { licenseId, type: "DEBIT", amount, balanceAfter: newBalance, reason: (payload.reason as string) || "Removed gems", performedBy: ctx.approvedByName } });
    return { balance: updated, transaction };
  });

  await logAudit(AUDIT_ACTIONS.GEMS_REVOKED, license.id, license.organization, ctx.approvedBy, ctx.approvedByName, `Removed ${amount} gems from ${license.organization}`, ctx.approvedByEmail);

  return { success: true, message: "Gems removed", data: result };
}

async function executeGemsSet(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const licenseId = payload.licenseId as string;
  const amount = Number(payload.amount);

  const license = await prisma.license.findUnique({ where: { id: licenseId } });
  if (!license) return { success: false, message: "License not found" };

  const balance = await prisma.gemBalance.upsert({ where: { licenseId }, create: { licenseId, balance: amount }, update: { balance: amount } });
  await logAudit(AUDIT_ACTIONS.GEMS_SET, license.id, license.organization, ctx.approvedBy, ctx.approvedByName, `Set ${license.organization} gem balance to ${amount}`, ctx.approvedByEmail);

  return { success: true, message: "Gem balance set", data: balance };
}

async function executeTeamCreate(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const name = payload.name as string;
  const email = payload.email as string;
  const roleId = payload.roleId as string;
  const tempPassword = payload.tempPassword as string;

  const hashedPassword = await bcrypt.hash(tempPassword, 12);
  const member = await prisma.teamMember.create({ data: { name, email, roleId, password: hashedPassword }, include: { role: { select: { name: true } } } });
  await logAudit(AUDIT_ACTIONS.TEAM_MEMBER_CREATED, undefined, undefined, ctx.approvedBy, ctx.approvedByName, `Created team member ${name} (${email}) with role ${member.role.name}`, ctx.approvedByEmail);

  return { success: true, message: "Team member created", data: { ...member, tempPassword } };
}

async function executeTeamEdit(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const id = payload.id as string;
  const name = payload.name as string;
  const email = payload.email as string;
  const roleId = payload.roleId as string;

  const data: Record<string, string> = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (roleId) data.roleId = roleId;

  const member = await prisma.teamMember.update({ where: { id }, data, include: { role: { select: { name: true } } } });
  await logAudit(AUDIT_ACTIONS.TEAM_MEMBER_UPDATED, undefined, undefined, ctx.approvedBy, ctx.approvedByName, `Updated team member ${member.name}`, ctx.approvedByEmail);

  return { success: true, message: "Team member updated", data: member };
}

async function executeTeamChangeRole(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const id = payload.id as string;
  const roleId = payload.roleId as string;

  const member = await prisma.teamMember.update({ where: { id }, data: { roleId }, include: { role: { select: { name: true } } } });

  await prisma.session.updateMany({ where: { teamMemberId: id, expiresAt: { gt: new Date() } }, data: { expiresAt: new Date() } });
  await logAudit(AUDIT_ACTIONS.TEAM_MEMBER_ROLE_CHANGED, undefined, undefined, ctx.approvedBy, ctx.approvedByName, `Changed ${member.name}'s role to ${member.role.name}`, ctx.approvedByEmail);

  return { success: true, message: "Role changed", data: member };
}

async function executeOwnershipTransfer(payload: Record<string, unknown>, ctx: ExecutorContext): Promise<{ success: boolean; message: string; data?: unknown }> {
  const memberId = payload.memberId as string;
  const newOwnerEmail = payload.newOwnerEmail as string;

  const newOwnerRole = await prisma.role.findUnique({ where: { name: "OWNER" } });
  if (!newOwnerRole) return { success: false, message: "Owner role not found" };

  await prisma.teamMember.update({ where: { id: memberId }, data: { roleId: newOwnerRole.id } });
  await logAudit(AUDIT_ACTIONS.OWNERSHIP_TRANSFERRED, undefined, undefined, ctx.approvedBy, ctx.approvedByName, `Transferred ownership to ${newOwnerEmail}`, ctx.approvedByEmail);

  return { success: true, message: "Ownership transferred" };
}

const executors: Record<string, Executor> = {
  LICENSE_CREATE: executeLicenseCreate,
  LICENSE_BULK: executeLicenseBulkCreate,
  LICENSE_TRANSFER: executeLicenseTransfer,
  REGENERATE_KEY: executeRegenerateKey,
  PREMIUM_GRANT: executePremiumGrant,
  PREMIUM_EXTEND: executePremiumExtend,
  PREMIUM_CHANGE_PLAN: executePremiumPlanChange,
  PREMIUM_DOWNGRADE: executePremiumDowngrade,
  PREMIUM_CONVERT_LIFETIME: executePremiumConvertLifetime,
  PREMIUM_CONVERT_CUSTOM: executePremiumConvertCustom,
  COINS_GRANT: executeCoinsGrant,
  COINS_REMOVE: executeCoinsRemove,
  COINS_SET: executeCoinsSet,
  GEMS_GRANT: executeGemsGrant,
  GEMS_REVOKE: executeGemsRemove,
  GEMS_SET: executeGemsSet,
  TEAM_CREATE: executeTeamCreate,
  TEAM_UPDATE: executeTeamEdit,
  TEAM_CHANGE_ROLE: executeTeamChangeRole,
  TRANSFER_OWNERSHIP: executeOwnershipTransfer,
};

export async function executeApprovedAction(
  actionType: string,
  payload: Record<string, unknown>,
  ctx: ExecutorContext,
): Promise<{ success: boolean; message: string; data?: unknown }> {
  const executor = executors[actionType];
  if (!executor) {
    return { success: false, message: `No executor found for action type: ${actionType}` };
  }
  return executor(payload, ctx);
}
