import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 12);

  const owner = await prisma.role.upsert({
    where: { name: "OWNER" },
    update: {},
    create: { name: "OWNER", description: "Platform owner with full access", riskLevel: "High", protected: true },
  });

  const superAdmin = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {},
    create: { name: "SUPER_ADMIN", description: "Super administrator with elevated access", riskLevel: "High", protected: true },
  });

  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN", description: "Standard administrator", riskLevel: "Medium", protected: false },
  });

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
