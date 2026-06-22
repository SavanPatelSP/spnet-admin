import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const OWNER_EMAIL = "prod-owner@spnet.local";
const OWNER_NAME = "Production Owner";
const LICENSE_KEY = "SPNET-PROD-OWNER-00001";

function generatePassword(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

const ALL_PERMISSIONS = [
  "Create Licenses", "View Licenses", "Edit Licenses", "Delete Licenses",
  "Regenerate License Keys", "Toggle License Status", "Emergency License Lockdown",
  "Manage License Features", "Manage License Tags", "Manage License Templates",
  "Bulk Create Licenses", "Transfer Licenses", "Validate Licenses", "Manage Trials",
  "View License Usage", "View License Events", "Export Licenses",
  "View Devices", "Revoke Devices", "Manage Device Policies",
  "View Device Fingerprints", "Update Device Trust", "Blacklist Devices",
  "Whitelist Devices", "View Device Analytics", "Export Device Data", "Validate Devices",
  "View Users", "Create Users", "Edit Users", "Delete Users",
  "Manage MFA", "View Login History", "Manage Sessions",
  "User Lifecycle Management", "Bulk Invite Users", "Export Users",
  "View Team Members", "Invite Team Members", "Remove Team Members", "Change Member Roles",
  "View Password Policy", "Edit Password Policy",
  "View Roles", "Create Roles", "Edit Roles", "Delete Roles", "Clone Roles",
  "View Security Policies", "Edit Security Policies", "Toggle Security Policies",
  "View Audit Logs", "Export Audit Logs", "Configure Audit Settings",
  "View Revenue", "Manage Billing", "Manage Invoices", "Compliance Reporting",
  "Access Settings", "Edit System Settings", "Manage Notifications",
  "View Analytics", "Export Analytics Data",
  "View Reports", "Create Reports", "Schedule Reports", "Export Reports",
  "View Broadcasts", "Create Broadcasts", "Send Broadcasts", "Delete Broadcasts",
  "View Content", "Moderate Content", "Delete Content",
  "View Organizations", "Create Organizations", "Edit Organizations", "Delete Organizations",
  "View Tickets", "Manage Tickets", "Resolve Tickets",
  "View Gem Balances", "Grant Gems", "Revoke Gems", "View Gem History", "Manage Rewards",
  "gems.grant", "gems.revoke", "gems.bulk-grant", "gems.bulk-revoke",
  "gems.set", "gems.set-infinite", "gems.remove-infinite",
  "View Coin Balances", "Add Coins", "Remove Coins", "Refund Coins", "View Coin History",
  "coins.add", "coins.remove", "coins.refund", "coins.bulk-add", "coins.bulk-remove",
  "coins.set", "coins.set-infinite", "coins.remove-infinite", "coins.grant",
  "View Premium", "Grant Premium", "Revoke Premium", "Extend Premium",
  "Change Premium Plan", "View Premium History", "Manage Premium Requests",
  "premium.grant", "premium.revoke", "premium.extend", "premium.change-plan",
  "premium.bulk-grant", "premium.convert-lifetime", "premium.downgrade",
  "premium.convert-custom", "premium.requests.view", "premium.requests.approve",
  "premium.requests.reject", "premium.requests.convert",
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is not set. Export the Neon PostgreSQL URL.");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const existingCount = await prisma.teamMember.count();
    if (existingCount > 0) {
      const owner = await prisma.teamMember.findUnique({ where: { email: OWNER_EMAIL } });
      if (owner) {
        console.log(`Owner already exists: ${OWNER_EMAIL}. No changes made.`);
        process.exit(0);
      }
      console.error(`Database has ${existingCount} team member(s) but no owner. Manual audit required.`);
      process.exit(1);
    }

    const password = generatePassword(24);
    const hash = await bcrypt.hash(password, 12);

    const role = await prisma.role.upsert({
      where: { name: "OWNER" },
      update: {},
      create: {
        name: "OWNER",
        description: "Platform owner with full access",
        riskLevel: "High",
        protected: true,
      },
    });

    await prisma.permission.deleteMany({ where: { roleId: role.id } });
    await prisma.permission.createMany({
      data: ALL_PERMISSIONS.map((p) => ({ roleId: role.id, permission: p })),
    });

    const license = await prisma.license.upsert({
      where: { key: LICENSE_KEY },
      update: {},
      create: {
        key: LICENSE_KEY,
        organization: "SP-NET Production",
        plan: "ENTERPRISE",
        status: "ACTIVE",
        maxDevices: 25,
        expiresAt: new Date("2035-12-31"),
        notes: "Production owner license key",
      },
    });

    await prisma.teamMember.upsert({
      where: { email: OWNER_EMAIL },
      update: {},
      create: {
        name: OWNER_NAME,
        email: OWNER_EMAIL,
        password: hash,
        roleId: role.id,
        licenseId: license.id,
        isFirstLogin: true,
      },
    });

    console.log("╔══════════════════════════════════════════════════════════════════╗");
    console.log("║  PRODUCTION OWNER CREATED                                       ║");
    console.log(`║  Email:    ${OWNER_EMAIL.padEnd(37)}║`);
    console.log(`║  Password: ${password.padEnd(37)}║`);
    console.log(`║  License:  ${LICENSE_KEY.padEnd(37)}║`);
    console.log("╚══════════════════════════════════════════════════════════════════╝");

    console.log("\nRecords created:");
    console.log("  - Role: OWNER (with all permissions)");
    console.log("  - License: SPNET-PROD-OWNER-00001 (ENTERPRISE, ACTIVE)");
    console.log("  - TeamMember: prod-owner@spnet.local (OWNER role)");
    console.log("\nRemaining blockers: none");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
