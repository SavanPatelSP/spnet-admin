import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  "Create Licenses", "View Licenses", "Edit Licenses", "Delete Licenses",
  "Regenerate License Keys", "Toggle License Status", "Emergency License Lockdown",
  "View Devices", "Revoke Devices", "Manage Device Policies",
  "View Users", "Create Users", "Edit Users", "Delete Users",
  "View Team Members", "Invite Team Members", "Remove Team Members", "Change Member Roles",
  "View Roles", "Create Roles", "Edit Roles", "Delete Roles", "Clone Roles",
  "View Security Policies", "Edit Security Policies", "Toggle Security Policies",
  "View Audit Logs", "Export Audit Logs", "Configure Audit Settings",
  "View Revenue", "Manage Billing", "Compliance Reporting",
  "Access Settings", "Edit System Settings", "Manage Notifications",
  "View Analytics", "Export Analytics Data",
  "View Reports", "Create Reports", "Schedule Reports", "Export Reports",
  "View Broadcasts", "Create Broadcasts", "Send Broadcasts", "Delete Broadcasts",
  "View Content", "Moderate Content", "Delete Content",
  "View Organizations", "Create Organizations", "Edit Organizations", "Delete Organizations",
  "View Tickets", "Manage Tickets", "Resolve Tickets",
  "View Gem Balances", "Grant Gems", "Revoke Gems", "View Gem History", "Manage Rewards",
  "View Coin Balances", "Add Coins", "Remove Coins", "Refund Coins", "View Coin History",
  "View Premium", "Grant Premium", "Revoke Premium", "Extend Premium",
  "Change Premium Plan", "View Premium History",
];

async function assignPermissions(roleId: string, permissions: string[]) {
  await prisma.permission.deleteMany({ where: { roleId } });
  if (permissions.length > 0) {
    await prisma.permission.createMany({
      data: permissions.map((permission) => ({ roleId, permission })),
    });
  }
}

async function main() {
  const hash = await bcrypt.hash("admin123", 12);

  const owner = await prisma.role.upsert({
    where: { name: "OWNER" },
    update: {},
    create: { name: "OWNER", description: "Platform owner with full access", riskLevel: "High", protected: true },
  });
  await assignPermissions(owner.id, ALL_PERMISSIONS);

  const superAdmin = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN", description: "Super administrator with elevated access", riskLevel: "High", protected: true },
  });
  await assignPermissions(superAdmin.id, ALL_PERMISSIONS);

  const admin = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN", description: "Standard administrator", riskLevel: "Medium", protected: false },
  });
  await assignPermissions(admin.id, ALL_PERMISSIONS);

  await prisma.role.upsert({
    where: { name: "DEVELOPER" },
    update: {},
    create: { name: "DEVELOPER", description: "Developer with technical access", riskLevel: "Medium", protected: false },
  });

  await prisma.role.upsert({
    where: { name: "BILLING_MANAGER" },
    update: {},
    create: { name: "BILLING_MANAGER", description: "Manages billing and subscriptions", riskLevel: "Medium", protected: false },
  });

  await prisma.role.upsert({
    where: { name: "SUPPORT_AGENT" },
    update: {},
    create: { name: "SUPPORT_AGENT", description: "Customer support agent", riskLevel: "Low", protected: false },
  });

  await prisma.role.upsert({
    where: { name: "ANALYST" },
    update: {},
    create: { name: "ANALYST", description: "Read-only analytics access", riskLevel: "Low", protected: false },
  });

  // Create owner team member with license
  const ownerLicense = await prisma.license.upsert({
    where: { key: "SPNET-OWNER-00001-ADMIN" },
    update: {},
    create: {
      key: "SPNET-OWNER-00001-ADMIN",
      organization: "SP-NET",
      plan: "ENTERPRISE",
      status: "ACTIVE",
      maxDevices: 25,
      expiresAt: new Date("2030-12-31"),
      notes: "Owner license key",
    },
  });

  await prisma.teamMember.upsert({
    where: { email: "owner@spnet.local" },
    update: {},
    create: {
      name: "Savan Patel",
      email: "owner@spnet.local",
      password: hash,
      roleId: owner.id,
      licenseId: ownerLicense.id,
    },
  });

  // Create admin team member with license
  const adminLicense = await prisma.license.upsert({
    where: { key: "SPNET-ADMIN-00002-ADMIN" },
    update: {},
    create: {
      key: "SPNET-ADMIN-00002-ADMIN",
      organization: "SP-NET",
      plan: "ENTERPRISE",
      status: "ACTIVE",
      maxDevices: 15,
      expiresAt: new Date("2028-06-30"),
      notes: "Admin license key",
    },
  });

  await prisma.teamMember.upsert({
    where: { email: "admin@spnet.local" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@spnet.local",
      password: hash,
      roleId: superAdmin.id,
      licenseId: adminLicense.id,
    },
  });

  const securityPolicies = [
    { name: "Audit Logging", description: "Log all administrative actions for compliance", category: "Authentication", severity: "High", systemManaged: true },
    { name: "MFA Enforcement", description: "Require multi-factor authentication for all admin users", category: "Authentication", severity: "High", systemManaged: true },
    { name: "Session Timeout", description: "Automatically expire inactive sessions after 30 minutes", category: "Authentication", severity: "Medium", systemManaged: true },
    { name: "IP Allowlist", description: "Restrict admin access to approved IP addresses", category: "Network", severity: "High", systemManaged: false },
    { name: "Rate Limiting", description: "Limit API request rates to prevent abuse", category: "Network", severity: "Medium", systemManaged: true },
    { name: "Device Fingerprinting", description: "Verify device identity during license activation", category: "Device Security", severity: "Medium", systemManaged: true },
    { name: "Emergency Lockdown", description: "Ability to suspend all licenses and sessions instantly", category: "Device Security", severity: "High", systemManaged: true },
    { name: "Duplicate Device Protection", description: "Prevent multiple activations from the same device", category: "Device Security", severity: "Medium", systemManaged: true },
  ];

  // Create premium subscription records for seed licenses
  await prisma.premiumSubscription.upsert({
    where: { id: "seed-premium-owner" },
    update: {},
    create: {
      id: "seed-premium-owner",
      licenseId: ownerLicense.id,
      plan: "ENTERPRISE",
      action: "GRANTED",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2030-12-31"),
      durationDays: 2555,
      grantedBy: "System",
      notes: "Owner default premium subscription",
      previousPlan: "FREE",
      previousEndDate: new Date("2023-12-31"),
    },
  });

  await prisma.premiumSubscription.upsert({
    where: { id: "seed-premium-admin" },
    update: {},
    create: {
      id: "seed-premium-admin",
      licenseId: adminLicense.id,
      plan: "ENTERPRISE",
      action: "GRANTED",
      startDate: new Date("2024-06-01"),
      endDate: new Date("2028-06-30"),
      durationDays: 1460,
      grantedBy: "System",
      notes: "Admin default premium subscription",
      previousPlan: "FREE",
      previousEndDate: new Date("2024-05-31"),
    },
  });

  // Create additional seed premium subscriptions with various plans and types
  await prisma.premiumSubscription.upsert({
    where: { id: "seed-premium-plus" },
    update: {},
    create: {
      id: "seed-premium-plus",
      licenseId: ownerLicense.id,
      plan: "PLUS",
      action: "GRANTED",
      subscriptionType: "MONTHLY",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-07-01"),
      durationDays: 180,
      grantedBy: "System",
      notes: "PLUS plan with MONTHLY subscription",
      previousPlan: "FREE",
      previousEndDate: new Date("2025-12-31"),
    },
  });

  await prisma.premiumSubscription.upsert({
    where: { id: "seed-premium-pro" },
    update: {},
    create: {
      id: "seed-premium-pro",
      licenseId: adminLicense.id,
      plan: "PRO",
      action: "GRANTED",
      subscriptionType: "YEARLY",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2027-01-01"),
      durationDays: 365,
      grantedBy: "System",
      notes: "PRO plan with YEARLY subscription",
      previousPlan: "FREE",
      previousEndDate: new Date("2025-12-31"),
    },
  });

  // Create coin balances and transactions for seed licenses
  await prisma.coinBalance.upsert({
    where: { licenseId: ownerLicense.id },
    update: {},
    create: { licenseId: ownerLicense.id, balance: 5000 },
  });
  await prisma.coinTransaction.create({
    data: {
      licenseId: ownerLicense.id,
      type: "CREDIT",
      amount: 5000,
      balanceAfter: 5000,
      reason: "Initial seed balance",
      performedBy: "System",
    },
  });
  await prisma.coinTransaction.create({
    data: {
      licenseId: ownerLicense.id,
      type: "DEBIT",
      amount: -250,
      balanceAfter: 4750,
      reason: "Feature usage fee",
      performedBy: "System",
    },
  });

  await prisma.coinBalance.upsert({
    where: { licenseId: adminLicense.id },
    update: {},
    create: { licenseId: adminLicense.id, balance: 2500 },
  });
  await prisma.coinTransaction.create({
    data: {
      licenseId: adminLicense.id,
      type: "CREDIT",
      amount: 2500,
      balanceAfter: 2500,
      reason: "Initial seed balance",
      performedBy: "System",
    },
  });

  // Create gem rewards
  const achievementReward = await prisma.gemReward.upsert({
    where: { name: "Achievement Unlocked" },
    update: {},
    create: { name: "Achievement Unlocked", description: "Awarded when a license holder completes a milestone", amount: 50, cooldownDays: 30, createdBy: "System" },
  });
  await prisma.gemReward.upsert({
    where: { name: "Referral Bonus" },
    update: {},
    create: { name: "Referral Bonus", description: "Reward for referring a new organization", amount: 200, cooldownDays: null, createdBy: "System" },
  });
  await prisma.gemReward.upsert({
    where: { name: "Survey Completion" },
    update: {},
    create: { name: "Survey Completion", description: "Reward for completing feedback survey", amount: 25, cooldownDays: 90, createdBy: "System" },
  });

  // Create gem balances and transactions for seed licenses
  await prisma.gemBalance.upsert({
    where: { licenseId: ownerLicense.id },
    update: {},
    create: { licenseId: ownerLicense.id, balance: 1000 },
  });
  await prisma.gemTransaction.create({
    data: {
      licenseId: ownerLicense.id,
      type: "GRANT",
      amount: 1000,
      balanceAfter: 1000,
      reason: "Initial seed gems",
      performedBy: "System",
    },
  });
  await prisma.gemTransaction.create({
    data: {
      licenseId: ownerLicense.id,
      type: "REWARD",
      amount: 50,
      balanceAfter: 1050,
      rewardId: achievementReward.id,
      reason: "Achievement Unlocked",
      performedBy: "System",
    },
  });

  await prisma.gemBalance.upsert({
    where: { licenseId: adminLicense.id },
    update: {},
    create: { licenseId: adminLicense.id, balance: 500 },
  });
  await prisma.gemTransaction.create({
    data: {
      licenseId: adminLicense.id,
      type: "GRANT",
      amount: 500,
      balanceAfter: 500,
      reason: "Initial seed gems",
      performedBy: "System",
    },
  });

  for (const policy of securityPolicies) {
    await prisma.securityPolicy.upsert({
      where: { name: policy.name },
      update: {},
      create: { ...policy, enabled: true },
    });
  }

  console.log("Seed complete");
  console.log("  Owner: owner@spnet.local / admin123 / SPNET-OWNER-00001-ADMIN");
  console.log("  Admin: admin@spnet.local / admin123 / SPNET-ADMIN-00002-ADMIN");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
