import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

let initialized = false;

const PRODUCTION_OWNER_EMAIL = "prod-owner@spnet.local";
const PRODUCTION_OWNER_NAME = "Production Owner";
const PRODUCTION_LICENSE_KEY = "SPNET-PROD-OWNER-00001";
const PRODUCTION_PASSWORD_LENGTH = 24;

function generateSecurePassword(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
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

async function assignPermissions(
  prisma: PrismaClient,
  roleId: string,
  permissions: string[],
) {
  await prisma.permission.deleteMany({ where: { roleId } });
  if (permissions.length > 0) {
    await prisma.permission.createMany({
      data: permissions.map((permission) => ({ roleId, permission })),
    });
  }
}

export interface ProductionOwnerResult {
  created: boolean;
  email: string;
  password?: string;
  alreadyExisted: boolean;
}

export async function initProductionOwner(
  prisma: PrismaClient,
): Promise<ProductionOwnerResult> {
  if (initialized) {
    return {
      created: false,
      email: PRODUCTION_OWNER_EMAIL,
      alreadyExisted: true,
    };
  }
  initialized = true;

  const teamMemberCount = await prisma.teamMember.count();

  if (teamMemberCount === 0) {
    const password = generateSecurePassword(PRODUCTION_PASSWORD_LENGTH);
    const hash = await bcrypt.hash(password, 12);

    const ownerRole = await prisma.role.upsert({
      where: { name: "OWNER" },
      update: {},
      create: {
        name: "OWNER",
        description: "Platform owner with full access",
        riskLevel: "High",
        protected: true,
      },
    });
    await assignPermissions(prisma, ownerRole.id, ALL_PERMISSIONS);

    const prodLicense = await prisma.license.upsert({
      where: { key: PRODUCTION_LICENSE_KEY },
      update: {},
      create: {
        key: PRODUCTION_LICENSE_KEY,
        organization: "SP-NET Production",
        plan: "ENTERPRISE",
        status: "ACTIVE",
        maxDevices: 25,
        expiresAt: new Date("2035-12-31"),
        notes: "Production owner license key",
      },
    });

    await prisma.teamMember.upsert({
      where: { email: PRODUCTION_OWNER_EMAIL },
      update: {},
      create: {
        name: PRODUCTION_OWNER_NAME,
        email: PRODUCTION_OWNER_EMAIL,
        password: hash,
        roleId: ownerRole.id,
        licenseId: prodLicense.id,
        isFirstLogin: true,
      },
    });

    console.log(
      "╔══════════════════════════════════════════════════════════════════╗\n" +
        "║  PRODUCTION OWNER CREATED                                       ║\n" +
        `║  Email:    ${PRODUCTION_OWNER_EMAIL.padEnd(37)}║\n` +
        `║  Password: ${password.padEnd(37)}║\n` +
        `║  License:  ${PRODUCTION_LICENSE_KEY.padEnd(37)}║\n` +
        "╚══════════════════════════════════════════════════════════════════╝",
    );

    return {
      created: true,
      email: PRODUCTION_OWNER_EMAIL,
      password,
      alreadyExisted: false,
    };
  }

  const existingOwner = await prisma.teamMember.findUnique({
    where: { email: PRODUCTION_OWNER_EMAIL },
    include: { role: true },
  });

  if (existingOwner) {
    console.log(
      "╔══════════════════════════════════════════════════════════════════╗\n" +
        "║  PRODUCTION OWNER ALREADY EXISTS                                ║\n" +
        `║  Email:    ${existingOwner.email.padEnd(37)}║\n` +
        `║  Role:     ${existingOwner.role.name.padEnd(37)}║\n` +
        "╚══════════════════════════════════════════════════════════════════╝",
    );
    return {
      created: false,
      email: PRODUCTION_OWNER_EMAIL,
      alreadyExisted: true,
    };
  }

  console.warn(
    "╔══════════════════════════════════════════════════════════════════╗\n" +
      "║  WARNING: Production database has records but no owner account  ║\n" +
      "║  Database has team members, but no production owner found.     ║\n" +
      "║  Manual intervention required.                                 ║\n" +
      "╚══════════════════════════════════════════════════════════════════╝",
  );

  return {
    created: false,
    email: PRODUCTION_OWNER_EMAIL,
    alreadyExisted: false,
  };
}
