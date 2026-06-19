/*
  Warnings:

  - You are about to drop the column `lastSeen` on the `Activation` table. All the data in the column will be lost.
  - You are about to drop the column `manufacturer` on the `Activation` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `Activation` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Activation` table. All the data in the column will be lost.
  - You are about to drop the column `activationId` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `confidenceScore` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `firstSeen` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `lastSeen` on the `DeviceFingerprint` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "productType" TEXT NOT NULL,
    "appliesTo" TEXT,
    "targetPlan" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" REAL NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "licenseId" TEXT,
    "organization" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL DEFAULT 'SALE',
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "action" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lineItems" TEXT,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" DATETIME,
    "paidAt" DATETIME,
    "notes" TEXT,
    "actorName" TEXT,
    "actorEmail" TEXT,
    "targetName" TEXT,
    "targetId" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenseId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "ipAddress" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "deviceType" TEXT,
    "userAgent" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "country" TEXT,
    "city" TEXT,
    "isp" TEXT,
    "trustScore" INTEGER NOT NULL DEFAULT 50,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceFingerprintId" TEXT,
    CONSTRAINT "Activation_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activation_deviceFingerprintId_fkey" FOREIGN KEY ("deviceFingerprintId") REFERENCES "DeviceFingerprint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Activation" ("browser", "browserVersion", "city", "country", "createdAt", "deviceId", "deviceName", "deviceType", "id", "ipAddress", "isBlacklisted", "isp", "licenseId", "os", "trustScore") SELECT "browser", "browserVersion", "city", "country", "createdAt", "deviceId", "deviceName", "deviceType", "id", "ipAddress", "isBlacklisted", "isp", "licenseId", "os", "trustScore" FROM "Activation";
DROP TABLE "Activation";
ALTER TABLE "new_Activation" RENAME TO "Activation";
CREATE TABLE "new_DeviceFingerprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprint" TEXT NOT NULL,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activationCount" INTEGER NOT NULL DEFAULT 0,
    "licenseIds" TEXT
);
INSERT INTO "new_DeviceFingerprint" ("fingerprint", "id") SELECT "fingerprint", "id" FROM "DeviceFingerprint";
DROP TABLE "DeviceFingerprint";
ALTER TABLE "new_DeviceFingerprint" RENAME TO "DeviceFingerprint";
CREATE UNIQUE INDEX "DeviceFingerprint_fingerprint_key" ON "DeviceFingerprint"("fingerprint");
CREATE TABLE "new_TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "licenseId" TEXT,
    "lastLogin" DATETIME,
    "lastLoginIp" TEXT,
    "lastUserAgent" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "mfaSecret" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "passwordChangedAt" DATETIME,
    "inviteToken" TEXT,
    "inviteTokenExpiresAt" DATETIME,
    "passwordSetupAt" DATETIME,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "ssoProvider" TEXT,
    "ssoId" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TeamMember" ("avatarUrl", "createdAt", "department", "email", "failedLoginAttempts", "id", "lastLogin", "lastLoginIp", "lastUserAgent", "licenseId", "lockedUntil", "mfaEnabled", "mfaSecret", "name", "password", "passwordChangedAt", "phone", "roleId", "ssoId", "ssoProvider", "status", "updatedAt") SELECT "avatarUrl", "createdAt", "department", "email", "failedLoginAttempts", "id", "lastLogin", "lastLoginIp", "lastUserAgent", "licenseId", "lockedUntil", "mfaEnabled", "mfaSecret", "name", "password", "passwordChangedAt", "phone", "roleId", "ssoId", "ssoProvider", "status", "updatedAt" FROM "TeamMember";
DROP TABLE "TeamMember";
ALTER TABLE "new_TeamMember" RENAME TO "TeamMember";
CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember"("email");
CREATE UNIQUE INDEX "TeamMember_licenseId_key" ON "TeamMember"("licenseId");
CREATE UNIQUE INDEX "TeamMember_inviteToken_key" ON "TeamMember"("inviteToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_licenseId_idx" ON "Invoice"("licenseId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_category_idx" ON "Invoice"("category");

-- CreateIndex
CREATE INDEX "Invoice_action_idx" ON "Invoice"("action");

-- CreateIndex
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");
