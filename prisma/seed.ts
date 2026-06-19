import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  // License Management
  "Create Licenses", "View Licenses", "Edit Licenses", "Delete Licenses",
  "Regenerate License Keys", "Toggle License Status", "Emergency License Lockdown",
  "Manage License Features", "Manage License Tags", "Manage License Templates",
  "Bulk Create Licenses", "Transfer Licenses", "Validate Licenses", "Manage Trials",
  "View License Usage", "View License Events", "Export Licenses",
  // Device Management
  "View Devices", "Revoke Devices", "Manage Device Policies",
  "View Device Fingerprints", "Update Device Trust", "Blacklist Devices",
  "Whitelist Devices", "View Device Analytics", "Export Device Data", "Validate Devices",
  // User Management
  "View Users", "Create Users", "Edit Users", "Delete Users",
  "Manage MFA", "View Login History", "Manage Sessions",
  "User Lifecycle Management", "Bulk Invite Users", "Export Users",
  // Team Management
  "View Team Members", "Invite Team Members", "Remove Team Members", "Change Member Roles",
  // Password Policy
  "View Password Policy", "Edit Password Policy",
  // Role Management
  "View Roles", "Create Roles", "Edit Roles", "Delete Roles", "Clone Roles",
  // Security
  "View Security Policies", "Edit Security Policies", "Toggle Security Policies",
  // Audit & Compliance
  "View Audit Logs", "Export Audit Logs", "Configure Audit Settings",
  // Billing & Revenue
  "View Revenue", "Manage Billing", "Manage Invoices", "Compliance Reporting",
  // Settings
  "Access Settings", "Edit System Settings", "Manage Notifications",
  // Analytics
  "View Analytics", "Export Analytics Data",
  // Reports
  "View Reports", "Create Reports", "Schedule Reports", "Export Reports",
  // Broadcasts
  "View Broadcasts", "Create Broadcasts", "Send Broadcasts", "Delete Broadcasts",
  // Content Moderation
  "View Content", "Moderate Content", "Delete Content",
  // Organizations
  "View Organizations", "Create Organizations", "Edit Organizations", "Delete Organizations",
  // Support
  "View Tickets", "Manage Tickets", "Resolve Tickets",
  // Gems Management
  "View Gem Balances", "Grant Gems", "Revoke Gems", "View Gem History", "Manage Rewards",
  "gems.grant", "gems.revoke", "gems.bulk-grant", "gems.bulk-revoke",
  "gems.set", "gems.set-infinite", "gems.remove-infinite",
  // Coins Management
  "View Coin Balances", "Add Coins", "Remove Coins", "Refund Coins", "View Coin History",
  "coins.add", "coins.remove", "coins.refund", "coins.bulk-add", "coins.bulk-remove",
  "coins.set", "coins.set-infinite", "coins.remove-infinite", "coins.grant",
  // Premium Management
  "View Premium", "Grant Premium", "Revoke Premium", "Extend Premium",
  "Change Premium Plan", "View Premium History", "Manage Premium Requests",
  "premium.grant", "premium.revoke", "premium.extend", "premium.change-plan",
  "premium.bulk-grant", "premium.convert-lifetime", "premium.downgrade",
  "premium.convert-custom", "premium.requests.view", "premium.requests.approve",
  "premium.requests.reject", "premium.requests.convert",
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

  // Create seed device activations
  const devices = [
    { deviceId: "DEV-MBP-001", deviceName: "Savan's MacBook Pro", ipAddress: "192.168.1.100", os: "macOS", browser: "Chrome", browserVersion: "120", deviceType: "desktop", trustScore: 95 },
    { deviceId: "DEV-WIN-001", deviceName: "Admin Windows PC", ipAddress: "192.168.1.101", os: "Windows 11", browser: "Edge", browserVersion: "120", deviceType: "desktop", trustScore: 88 },
    { deviceId: "DEV-PHONE-001", deviceName: "Admin iPhone", ipAddress: "10.0.0.50", os: "iOS 18", browser: "Safari", browserVersion: "18", deviceType: "mobile", trustScore: 75 },
    { deviceId: "DEV-LNX-001", deviceName: "Build Server", ipAddress: "10.0.1.200", os: "Ubuntu 24.04", browser: "Firefox", browserVersion: "130", deviceType: "server", trustScore: 100 },
  ];
  for (const dev of devices) {
    await prisma.activation.upsert({
      where: { id: `seed-act-${dev.deviceId.toLowerCase()}` },
      update: {},
      create: {
        id: `seed-act-${dev.deviceId.toLowerCase()}`,
        licenseId: ownerLicense.id,
        deviceId: dev.deviceId,
        deviceName: dev.deviceName,
        ipAddress: dev.ipAddress,
        os: dev.os,
        browser: dev.browser,
        browserVersion: dev.browserVersion,
        deviceType: dev.deviceType,
        trustScore: dev.trustScore,
        status: "ACTIVE",
        lastSeenAt: new Date(),
      },
    });
  }

  // Add a second device for admin license
  await prisma.activation.upsert({
    where: { id: "seed-act-dev-admin-win" },
    update: {},
    create: {
      id: "seed-act-dev-admin-win",
      licenseId: adminLicense.id,
      deviceId: "DEV-ADMIN-WIN-002",
      deviceName: "Admin Secondary Laptop",
      ipAddress: "192.168.2.50",
      os: "Windows 11",
      browser: "Chrome",
      browserVersion: "121",
      deviceType: "desktop",
      trustScore: 82,
      status: "ACTIVE",
      lastSeenAt: new Date(),
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
